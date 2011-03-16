var Client = require('mysql').Client,
        dataset = require("./dataset"),
        model = require("./model"),
        adapters = require("./adapters"),
        util = require("./util"),
        hitch = util.hitch,
        promise = require("./promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        plugins = require("./plugins");

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

        type : "mysql",

        _free : null,

        options : null,

        constructor:function(options) {
            this.models = {};
            this._free = [];

        },

        /*
         * Create the client for the db type we are using
         *
         * options
         *  - minClients - minimum number of clients
         *  - db - the db to connect to
         *  - user - user
         *  - password - password
         * */
        createConnection : function(options) {
            options = options || {};
            this.type = options.type || "mysql";
            this.options = options || {};
            if (adapters[this.type]) {
                this.client = new adapters[this.type].client(this.options);
            } else {
                throw new Error(this.type + " is not supported");
            }
        },

        getConnection : function(autoClose) {
            return this.client.getConnection(autoClose);
        },

        transaction : function() {
            return this.client.transaction();
        },

        getDataset : function(tableName) {
            if (tableName) {
                return dataset.getDataSet(tableName, this.getConnection(), this.type)
            } else {
                throw new Error("Table name required get getting a dataset");
            }
        },

        createTable : function(table, conn) {
            var ret = new Promise();
            var adapter = adapters[table.type];
            var connection = conn || this.getConnection();
            adapter.createTable(table, connection).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

        dropTable : function(table, conn) {
            var ret = new Promise();
            var adapter = adapters[table.type];
            var connection = conn || this.getConnection();
            adapter.dropTable(table, connection).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

        refresh : function(schema, conn) {
            if (schema instanceof Array) {
                var conn = conn || this.transaction();
                var pl = schema.map(function(s) {
                    return this.refresh(s, conn);
                }, this);
                return new PromiseList(pl);
            } else {
                var conn = conn || this.transaction();
                var promise = new Promise();
                this.dropTable(schema, conn)
                        .chain(hitch(this, "createTable", schema, conn), hitch(promise, "errback"))
                        .then(hitch(promise, "callback"), hitch(promise, "errback"));
                return promise;
            }
        },

        execute : function(sql) {
            var promise = new Promise();
            var db = this.transaction();
            db.query(sql).addErrback(hitch(promise, "errback"));
            db.commit();
            db.close().then(hitch(promise, "callback"));
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
exports.plugins = plugins;




