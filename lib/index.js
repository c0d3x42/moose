var Client = require('mysql').Client,
        dataset = require("./dataset"),
        model = require("./model"),
        adapters = require("./adapters"),
        comb = require("comb"),
        hitch = comb.hitch,
        Promise = comb.Promise,
        PromiseList = comb.PromiseList,
        plugins = require("./plugins"),
        migration = require("./migrations"),
        Table = require("./table").Table;

var connectionReady = false;

/**
 * @class A singleton class that acts as the entry point for all actions performed in moose.
 *
 * @constructs
 * @name moose
 * @augments Migrations
 * @param options
 *
 */
var Moose = comb.singleton(migration, {
    instance : {
    /**
     * @lends moose.prototype
     */

        /**
         * the models that are created and ready to be used.
         * @private
         */
        models : null,

        /**
         * The schemas that are created and ready to be used as the base of a model.
         * @private
         */
        schemas : null,

        /**
         *The type of database moose will be connecting to. Currently only mysql is supported.
         */
        type : "mysql",


        constructor : function(options) {
            this.__deferredSchemas = [];
            this.__deferredModels = [];
            this.models = {};
            this.schemas = {};
            this.super(arguments);
        },

        /**
         * Initialize the connection information, and prepare moose to communicate with the DB.
         * All models, and schemas, and models that are created before this method has been called will be deferred.
         *
         * @example
         *
         * moose.createConnection({
         *              type : "mysql",
         *              maxConnections : 1,
         *              minConnections : 1,
         *              user : "test",
         *              password : "testpass",
         *              database : 'test'
         *});
         *
         * @param {Object} options the options used to initialize the database connection.
         * @params {Number} [options.maxConnections = 10] the number of connections to pool.
         * @params {Number} [options.minConnections = 3] the number of connections to pool.
         * @param {String} [options.type = "mysql"] the type of database to communicate with.
         * @params {String} options.user the user to authenticate as.
         * @params {String} options.password the password of the user.
         * @params {String} options.database the name of the database to use.
         */
        createConnection : function(options) {
            //allow only one connection
            //We can  use the private singleton value, because moose is actually a singleton
            //TODO change this to allow connections to multiple databases
            if (!connectionReady) {
                options = options || {};
                this.options = options;
                this.type = options.type || "mysql";
                if (adapters[this.type]) {
                    this.client = new adapters[this.type].client(options);
                } else {
                    throw new Error(this.type + " is not supported");
                }
                connectionReady = true;
            }
        },

        /**
         * Retrieves a connection to the database. Can be used to work with the database driver directly.
         *
         * @param {Boolean} autoClose if set to true then a new connection will be created,
         *        otherwise a connection will be retrieved from a connection pool.
         *
         * @return {Query} a query object.
         */
        getConnection : function(autoClose) {
            return this.client.getConnection(autoClose);
        },

        /**
         * Creates a context for performing database transactions.
         * When using a transaction be sure to call commit with finished!
         * @example
         *
         * var trans = moose.transaction();
         * Do lots of stuff
         * .
         * .
         * .
         * trans.commit();
         *
         *
         * @return {TransactionQuery} a transaction context.
         */
        transaction : function() {
            return this.client.transaction();
        },

        /**
         * Creates a dataset to operate on a particular table.
         *
         * @param tableName the name of the table to perfrom operations on.
         *
         * @return {Dataset} a dataset to operate on a particular table.
         */
        getDataset : function(tableName) {
            if (tableName) {
                return dataset.getDataSet(tableName, this.getConnection(),
                        this.type);
            } else {
                throw new Error("Table name required get getting a dataset");
            }
        },

        /**
         * Execute raw SQL.
         *
         * @example
         *  moose.execute("select * from myTable");
         *
         * @param sql the SQL to execute
         *
         * @returns {comb.Promise} a promise that will be called after the SQL execution completes.
         */
        execute : function(sql) {
            var promise = new Promise();
            var db = this.transaction();
            db.query(sql).then(function(res) {
                db.commit().then(hitch(promise, "callback", res));
            }, hitch(promise, "errback"));
            return promise;
        },

        /**
         * Load a {@link moose.Table} to be used by a model or directly.
         * This is typically called before, one creates a new model.
         *
         * @example
         *
         * moose.loadSchema("testTable").then(function(schema){
         *     moose.addModel(schema, ...);
         * });
         *
         * @param {String} tableName the name of the table to load
         *
         * @return {comb.Promise} A promise is called back with a table ready for use.
         */
        loadSchema : function(tableName) {
            var promise = new Promise();
            if (connectionReady) {
                if (!(tableName in this.schemas)) {
                    adapters[this.type].schema(tableName, this.getConnection())
                            .then(hitch(this, function(schema) {
                        if (schema) {
                            this.schemas[tableName] = schema;
                        }
                        promise.callback(schema);
                    }), hitch(promise, "errback"));
                } else {
                    promise.callback(this.schemas[tableName]);
                }
            } else {
                this.__deferredSchemas.push(tableName);
            }
            return promise;
        },

        /**
         * Use to load a group of tables.
         * @example
         *  moose.loadSchema(["testTable", "testTable2", ....]).then(function(schema1, schema2,....){
         *     moose.addModel(schema1, ...);
         *     moose.addModel(schema2, ...);
         * });
         *
         *
         * @param {Array} tableNames the names of the tables to load.
         *
         * @return {comb.Promise} A promise that is called back with the tables in the same order that they were contained in the array.
         */
        loadSchemas : function(tableNames) {
            var ret = new Promise();
            if (tableNames instanceof Array) {
                if (tableNames.length) {
                    var ps = tableNames.map(function(name) {
                        return this.loadSchema(name);
                    }, this);
                    var pl = new PromiseList(ps);
                    pl.addCallback(function(r) {
                        // loop through and load the results
                        ret.callback.apply(ret, r.map(function(o) {
                            return o[1];
                        }));
                    });
                    pl.addErrback(hitch(ret, "errback"));
                } else {
                    ret.callback(null);
                }

            } else {
                throw new Error("tables names must be an array");
            }
            return ret;
        },

        /**
         * <p>Adds a model to moose.</p>
         * </br>
         * <b>NOTE</b>
         * <ul>
         *     <li>If a {moose.Table} is the first parameter then the {moose.Model} is returned immediately</li>
         *     <li>If a table name is the first parameter then a {comb.Promise} is returned, and called back with the model once it is loaded</li>
         * </ul>
         *
         * @example
         *
         *  moose.addModel(yourTable, moose, {
         *      plugins : [PLUGIN1, PLUGIN2, PLUGIN3]
         *      instance : {
         *          myInstanceMethod : funciton(){},
         *          getters : {
         *              myProp : function(){
         *                  return prop;
         *              }
         *          },
         *
         *          setters : {
         *              myProp : function(val){
         *                   prop = val;
         *              }
         *          }
         *      },
         *
         *      static : {
         *          myStaticMethod : function(){
         *
         *          },
         *
         *           getters : {
         *              myStaticProp : function(){
         *                  return prop;
         *              }
         *          },
         *
         *          setters : {
         *              myStaticProp : function(val){
         *                   prop = val;
         *              }
         *          }
         *      },
         *
         *      pre : {
         *          save : function(){
         *
         *          }
         *      },
         *
         *      post : {
         *          save  : function(){
         *
         *          }
         *      }
         *  });
         *
         *
         * @param {String|moose.Table} table the table to be used as the base for this model.
         * Factory for a new Model.
         * @param {Object} options - Similar to {@link comb.define} with a few other conveniences
         * @param {Array} options.plugins a list of plugins to enable on the model.
         * @param {Object} options.pre an object containing key value pairs of events, and the corresponding callback.
         *  <pre class="code">
         *   {
         *      pre : {
         *          save : funciton(){},
         *          update : function(){},
         *          load : function(){},
         *          remove : function(){}
         *      }
         *   }
         * </pre>
         *
         * @param {Object} options.post an object containing key value pairs of events, and the corresponding callback.
         *  <pre class="code">
         *   {
         *      post : {
         *          save : funciton(){},
         *          update : function(){},
         *          load : function(){},
         *          remove : function(){}
         *      }
         *   }
         * </pre>
         *
         *
         * @return {comb.Promise|Model} see description.
         *
         */
        addModel : function(table, options) {
            var promise = new Promise(), m;
            if (table instanceof Table) {
                m = (this.models[table.tableName] = model.create(table, this,
                        options || {}));
                return m;
            } else {
                if (connectionReady) {
                    if (this.models[table]) {
                        promise.callback(this.models[table]);
                    } else {
                        if (typeof table == "string") {
                            if (!table in this.schemas) {
                                this.loadSchema(table).then(
                                        function(schema) {
                                            var m = (this.models[table] = model
                                                    .create(schema, this,
                                                    options || {}));
                                            promise.callback(m);
                                        }, hitch(promise, "errback"));
                            } else {
                                m = (this.models[table] = model.create(
                                        this.schemas[table], this, options
                                        || {}));
                                promise.callback(m);
                            }
                        }
                    }
                } else {
                    this.__deferredModels.push(arguments);
                }
            }
            return promise;
        },

        /**
         * Retrieve an already created table.
         *
         * @param {String} tableName the name of the table
         *
         * @return {moose.Table} return the table or null of it is not found.
         */
        getSchema : function(tableName) {
            var m = null;
            if (tableName in this.schemas) {
                m = this.schemas[tableName];
            }
            return m;
        },

        /**
         * Retrieve an already created model.
         *
         * @param {String} tableName the name of the table the model wraps.
         *
         * @return {moose.Model} return the model or null of it is not found.
         */
        getModel : function(tableName) {
            var m = null;
            if (this.models[tableName]) {
                m = this.models[tableName];
            }
            return m;
        }
    }
});

var moose = exports;
module.exports = moose = new Moose();

moose.Table = Table;
/**
 * @namespace
 */
moose.adapters = adapters;
/**
 * @namespace
 */
moose.plugins = plugins;