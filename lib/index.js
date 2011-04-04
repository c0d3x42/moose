var Client = require('mysql').Client,
        dataset = require("./dataset"),
        model = require("./model"),
        adapters = require("./adapters"),
        util = require("./util"),
        hitch = util.hitch,
        promise = require("./promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        plugins = require("./plugins"),
        migration = require("./migrations"),
        Table = require("./table").Table;

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

var Moose = util.define(migration, {
    instance : {

        models : null,
        schemas : null,

        type : "mysql",

        _free : null,

        options : null,

        constructor:function(options) {
            this.__deferredSchemas = [];
            this.__deferredModels = [];
            this.models = {};
            this.schemas = {};
            this._free = [];
            this.super(arguments);
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
            this.__connectionReady = true;
        },

        __beforeReady : function() {
            //load the deferred schemas
            var loadModels = function() {
                if (this.__deferredModels.length) {
                    var mpl = this.__deferredModels.map(function(n) {
                        this.addModel.apply(this, n);
                    }, this)
                     mpl = new PromiseList(mpl);
                    mpl.addCallback(hitch(this, "ready"));
                } else {
                    this.ready();
                }
            };
            if (this.__deferredSchemas.length) {
                var spl = this.__deferredSchemas.map(function(n) {
                    return this.loadSchema(n)
                }, this);
                var pl = new PromiseList(spl);
                pl.then(hitch(this, loadModels));
            } else {
                loadModels.apply(this);
            }
        },

        ready : function() {
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

        execute : function(sql) {
            var promise = new Promise();
            var db = this.transaction();
            db.query(sql).then(function(res){
                db.commit().then(hitch(promise, "callback", res));
            },hitch(promise, "errback"));
            return promise;
        },

        loadSchema : function(tableName) {
            var promise = new Promise();
            if (this.__connectionReady) {
                if (!(tableName in this.schemas)) {
                    adapters[this.type].schema(tableName, this.getConnection()).then(hitch(this, function(schema) {
                        if (schema) {
                            this.schemas[tableName] = schema;
                        }
                        promise.callback(schema);
                    }), hitch(promise, "errback"));
                } else {
                    promise.callback(this.schemas[tableName]);
                }
            } else {
                this.__deferredSchemas.push(tableName)
            }
            return promise;
        },

        loadSchemas : function(tableNames) {
            var ret = new Promise();
            if (tableNames instanceof Array) {
                if (tableNames.length) {
                    var ps = tableNames.map(function(name) {
                        return this.loadSchema(name)
                    }, this);
                    var pl = new PromiseList(ps);
                    pl.addCallback(function(r){
                        //loop through and load the results
                        ret.callback.apply(ret, r.map(function(o){return o[1]}));
                    });
                    pl.addErrback(hitch(ret, "errback"))
                } else {
                    ret.callback(null);
                }

            } else {
                throw new Error("tables names must be an array");
            }
            return ret;
        },

        /*
         * Adds a model to moose
         * if a Table object is passed in then then model is returned immediatly
         * otherwise the loading is deferred and a promise is returned
         * TODO may abstract this out to be different methods?
         *
         * */
        addModel : function(table, options) {
            var promise = new Promise(), m;
            if (table instanceof Table) {
                m = (this.models[table.tableName] = model.create(table, this, options || {}));
                return m;
            } else {
                if (this.__connectionReady) {
                    if (this.models[table]) {
                        promise.callback(this.models[table]);
                    } else {
                        if (typeof table == "string") {
                            if (!table in this.schemas) {
                                this.loadSchema(table).then(function(schema) {
                                    var m = (this.models[table] = model.create(schema, this, options || {}));
                                    promise.callback(m);
                                }, hitch(promise, "errback"));
                            } else {
                                m = (this.models[table] = model.create(this.schemas[table], this, options || {}));
                                promise.callback(m);
                            }
                        }
                    }
                } else {
                    this.__deferredModels.push(arguments);
                }
            }
            return  promise;
        },

        getSchema : function(tableName) {
            var m = null;
            if (tableName in this.schemas) {
                m = this.schemas[tableName];
            } else {
                throw new Error("Schema with " + tableName + " is not created yet");
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

util.merge(exports, util);
exports.Table = Table;
exports.Promise = Promise;
exports.PromiseList = PromiseList;
exports.adapters = adapters;
exports.plugins = plugins;




