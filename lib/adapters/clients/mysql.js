var mysql = require("mysql"),
        utilities = require("../../util"),
        hitch = utilities.hitch,
        promise = require("../../Promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList;


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

var Query = utilities.define(null, {
    instance : {

        constructor : function(connection, autoClose) {
            if (!connection) throw new Error("Connection required to query");
            this.connection = connection;
            this._ended = false;
            this.autoClose = typeof autoClose == "boolean" ? autoClose : true;
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


var TransactionQuery = utilities.define(Query, {
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
var pool = utilities.define(null, {
    instance :  {
        constructor : function(options) {
            var min = this.minConnections = typeof options.minConnections == "number" ? options.minConnections : 3;
            var max = this.maxConnections = typeof options.maxConnections == "number" ? options.maxConnections : 140;
            var conns = (this.connections = []);
            this._used = 0;
            for (var i = max - 1; i > 0; i--) {
                conns.push(getConnection(options));
            }
        },

        get : function() {
            return this.connections[this._used++ % this.maxConnections];
        }
    }
});


module.exports = exports = utilities.define(null, {
    instance : {

        minConnections : null,

        constructor : function(options) {
            this.options = options || {};
            this.minConnections = typeof options.minConnections == "number" ? options.minConnections : 3;
            this.maxConnections = typeof options.maxConnections == "number" ? options.maxConnections : 100;
            this.pool = new pool(options);
        },

        query : function(sql) {
            var q = new Query(getConnection(this.options));
            return q.query(sql);
        },

        getConnection : function(autoClose) {
            //if not autoClose just pull from pool
            //other wise let them do what they want with it;
            var conn = autoClose ? getConnection : this.pool.get();
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
