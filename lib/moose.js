var Client = require('mysql').Client,
        dataset = require("./dataset"),
        model = require("./model"),
        adapters = require("./adapters"),
        util = require("./util"),
        hitch = util.hitch,
        promise = require("./promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList;

/*options = {
 host = 'localhost';
 port = 3306;
 user = null;
 password = null;
 database = '';
 flags = Client.defaultFlags;
 maxPacketSize = 0x01000000;
 charsetNumber = Client.UTF8_UNICODE_CI;
 debug = false;
 }*/

var Moose = util.define(null, {
    instance : {

        models : null,

        _maxConections : 50,

        type : "mysql",

        _free : null,

        options : null,

        constructor:function(options) {
            this.models = {};
            this._free = [];

        },

        createConnection : function(options) {
            options = options || {};
            this.type = options.type || "mysql";
            this._maxConnections = options.maxConnections || 150;
            if (options) {
                options.typeCast = false;
                this.options = options;
            }
            for (var i = 0; i < this._maxConnections; i++) {
                this._free.push(new Client(this.options || {}));
            }
        },

        getConnection : function() {
            if (this._free.length == 0) {
                throw new Error("Max connections reached");
            }
            var client = this._free.pop();
            var self = this;
            client.done = function() {
                self._free.push(client);
                delete client.done;
            };
            if(!client.connected){
                client.connect();
            }
            return client;
        },

        getDataset : function(tableName) {
            if (tableName) {
                return dataset.getDataSet(tableName, this.getConnection(), this.type)
            } else {
                throw new Error("Table name required get getting a dataset");
            }
        },

        createTable : function(table) {
            var ret = new Promise();
            var adapter = adapters[table.type];
            var connection = this.getConnection();
            adapter.createTable(table, connection, function(err) {
                if (err != true) {
                    ret.errback(new Error("Error creating table " + table.tableName, err));
                } else {
                    ret.callback(err);
                }
                connection.done();
            });
            return ret;
        },

        dropTable : function(table) {
            var ret = new Promise();
            var adapter = adapters[table.type];
            var connection = this.getConnection();
            adapter.dropTable(table, connection, function(err) {
                if (err != true) {
                    ret.errback(new Error("Error creating table " + table.tableName, err));
                } else {
                    ret.callback(err);
                }
                connection.done();
            });
            return ret;
        },

        refresh : function(schema) {
            if (schema instanceof Array) {
                var pl = schema.map(function(s) {
                    return this.refresh(s);
                }, this);
                return new PromiseList(pl);
            } else {
                var promise = new Promise();
                this.dropTable(schema)
                        .chain(hitch(this, "createTable", schema), hitch(promise, "errback"))
                        .then(hitch(promise, "callback"), hitch(promise, "errback"));
                return promise;
            }
        },

        execute : function(sql) {
            var promise = new Promise();
            var db = this.getConnection();
            db.connect();
            var query = db.query(sql, function(err, results) {
                if (err) {
                    promise.errback(err);
                    db.end();
                } else {
                    db.end(hitch(promise, "callback", results));
                }
            });
            return promise;
        },

        migrate : function() {
        },

        addModel : function(table, options) {
            var m = null, tableName = table.tableName;
            if (this.models[tableName]) {
                m = this.models[tableName];
            } else {
                m = (this.models[tableName] = model.create(table, this, options || {}));
            }
            return  m;
        },

        getModel : function(tableName) {
            var m = null;
            if (this.models[tableName]) {
                m = this.models[tableName];
            } else {
                throw new Error("Model with " + tableName + " is not created yet");
            }
            return  m;
        }
    }   
});

module.exports = exports = new Moose();

exports.define = util.define;
exports.hitch = hitch;
exports.Table = require("./table").Table;
exports.Promise = Promise;
exports.PromiseList = PromiseList;
exports.adapters = adapters;




