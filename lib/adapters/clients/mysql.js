var mysql = require("mysql"),
        comb = require("comb"),
        hitch = comb.hitch,
        Promise = comb.Promise,
        PromiseList = comb.PromiseList,
        MySQLPool = require("mysql-pool").MySQLPool;


var closedCount = 0;
function throwCmdError(cmd, action) {
    cmd.on('error', function(err) {
        throw new Error('Failed to ' + action +
                (err && err.message ? ': ' + err.message : ''));
    });
}

function throwError(action, err) {
    throw new Error('Failed to ' + action +
            (err && err.message ? ': ' + err.message : ''));
}

var Query = comb.define(null, {
    instance : {

        constructor : function(connection, autoClose) {
            if (!connection) throw new Error("Connection required to query");
            this.connection = connection;
            this._ended = false;
            this.autoClose = typeof autoClose == "boolean" ? autoClose : false;
        },

        query : function(query) {
            var ret = new Promise();
            if (!this._ended) {
                this.connection.query(query, hitch(this, function(err, results, info) {
                    if (err) {
                        this.connection.clean = false;
                        ret.errback(err);
                    } else {
                        ret.callback(results, info);
                    }
                    if (this.autoClose) {
                        this.close();
                    }
                }));
            } else {
                throw new Error("Query has already been closed");
            }
            return ret;
        },

        close : function() {
            var ret = new Promise();
            if (!this._ended) {
                this.connection.end(hitch(this, function(err, res) {
                    this._ended = true;
                    if (err) {
                        ret.errback(err);
                    } else {
                        ret.callback(res);
                    }
                }));
            } else {
                throw new Error("Query has already been closed");
            }
            return ret;

        }
    }
});


var TransactionQuery = comb.define(Query, {
    instance : {

        query : function(query, args) {
            if (!this.connection.clean) {
                throw new Error("Cannot commit a transaction with an error");
                return;
            }
            return this.super(arguments);
        },

        commit: function() {
            var ret = new Promise();
            this.query("COMMIT").addErrback(hitch(null, throwError, 'commit SQL transaction'));
            this.close().then(hitch(ret, "callback"), hitch(null, throwError, "close conection"));
            return ret;
        },
        abort: function() {
            var ret = new Promise();
            this.query("ROLLBACK").addErrback(hitch(null, throwError, 'commit SQL transaction'));
            this.close().then(hitch(ret, "callback"), hitch(null, throwError, "close conection"));
            return ret;
        },

        rollback : function() {
            return this.abort();
        }
    }
});

var getConnection = function(options) {
    var conn = new mysql.Client(options);
    conn.clean = true;
    conn.connect();
    return conn;
};

//simple round robin pool
var pool = comb.define(null, {
    instance :  {
        constructor : function(options) {
            var min = this.minConnections = typeof options.minConnections == "number" ? options.minConnections : 3;
            var max = this.maxConnections = typeof options.maxConnections == "number" ? options.maxConnections : 10;
            var conns = (this.connections = []);
            this._used = 0;
            for (var i = max - 1; i >= 0; i--) {
                conns.push(getConnection(options));
            }
        },

        get : function() {
            return this.connections[this._used++ % this.maxConnections];
        }
    }
});


module.exports = exports = comb.define(null, {
    instance : {

        minConnections : null,

        constructor : function(options) {
            this.options = options || {};
            this.maxConnections = typeof options.maxConnections == "number" ? options.maxConnections : 10;
            this.pool = new MySQLPool(options);
            this.pool.connect(this.maxConnections);
        },

        query : function(sql) {
            var q = new Query(getConnection(this.options));
            return q.query(sql);
        },

        getConnection : function(autoClose) {
            //if not autoClose just pull from pool
            //other wise let them do what they want with it;
            var conn = autoClose ? getConnection() : this.pool;
            return new Query(conn, autoClose);
        },

        transaction: function() {
            var promise = new Promise();
            var conn = new TransactionQuery(getConnection(this.options), false);
            conn.query('SET autocommit=0;').addErrback(hitch(null, throwError, 'disable autocommit'));
            conn.query('BEGIN').addErrback(hitch(null, throwError, 'begin tranaction'));
            return conn;
        }
    }
});
