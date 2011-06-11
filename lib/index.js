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

var LOGGER = comb.logging.Logger.getLogger("moose");
new comb.logging.BasicConfigurator().configure();
LOGGER.level = comb.logging.Level.INFO;

/**
 * @class A singleton class that acts as the entry point for all actions performed in moose.
 *
 * @constructs
 * @name moose
 * @augments Migrations
 * @param options
 *
 * @property {String} database the default database to use, this property can only be used after the conneciton has
 *                             initialized.
 * @property {moose.adapters} adapter the adapter moose is using. <b>READ ONLY</b>
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
				 *              host : "127.0.0.1",
				 *              port : 3306,
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
				 * @params {String} options.database the name of the database to use, the database
				 *                                   specified here is the default database for all connections.
				 */
				createConnection : function(options) {
					//allow only one connection
					//We can  use the private singleton value, because moose is actually a singleton
					//TODO change this to allow connections to multiple databases
					if (!connectionReady) {
						options = options || {};
						this.options = options;
						this.type = options.type || "mysql";
						var adapter = this.adapter;
						if (adapter) {
							this.client = new adapter.client(options);
						} else {
							throw "moose : " + this.type + " is not supported";
						}
						//initialize the schema object with the default database
						var db = this.client.database;
						this.schemas[db] = {};
						this.models[db] = {};
						connectionReady = true;
					}
				},

				/**
				 * Closes all connections to the database.
				 */
				closeConnection : function() {
					var ret;
					if (connectionReady) {
						ret = this.client.close();
						connectionReady = false;
					} else {
						ret = new Promise();
						ret.callback();
					}
					return ret;
				},

				/**
				 * Retrieves a connection to the database. Can be used to work with the database driver directly.
				 *
				 * @param {Boolean} autoClose if set to true then a new connection will be created,
				 *        otherwise a connection will be retrieved from a connection pool.
				 * @param {String} [database] the database to perform the query on, if not defined
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used .
				 *
				 * @return {Query} a query object.
				 */
				getConnection : function(autoClose, database) {
					LOGGER.debug("MOOSE : GET CONNECTION " + database);
					return this.client.getConnection(autoClose, database);
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
				 * @param {String} [database] the database to perform the query on, if not defined
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used.
				 *
				 * @return {TransactionQuery} a transaction context.
				 */
				transaction : function(database) {
					return this.client.transaction(database);
				},

				/**
				 * Creates a dataset to operate on a particular table.
				 *
				 * @param tableName the name of the table to perfrom operations on.
				 * @param {String} [database] the database to perform the query on, if not defined
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used
				 *
				 * @return {Dataset} a dataset to operate on a particular table.
				 */
				getDataset : function(tableName, database) {
					if (tableName) {
						return dataset.getDataSet(tableName, this.getConnection(false, database),
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
				 *  moose.execute("select * from myTable", "myOtherDB");
				 *
				 * @param sql the SQL to execute
				 * @param {String} [database] the database to perform the query on, if not defined
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used
				 *
				 * @returns {comb.Promise} a promise that will be called after the SQL execution completes.
				 */
				execute : function(sql, database) {
					var promise = new Promise();
					var db = this.getConnection(true, database);
					db.query(sql).then(function(res) {
						promise.callback(res);
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
				 *
				 * @param {String} tableName the name of the table to load
				 * @param {String} [database] the database to retreive the table from, if not defined
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used
				 *
				 *
				 * @return {comb.Promise} A promise is called back with a table ready for use.
				 */
				loadSchema : function(tableName, database) {
					var promise = new Promise();
					if (connectionReady) {
						var db = database || this.client.database;
						var schema;
						if ((schema = this.schemas[db]) == null) {
							schema = this.schemas[db] = {};
						}
						LOGGER.debug("LOAD SCHEMA DB " + database);
						if (!(tableName in schema)) {
							this.adapter.schema(tableName, this.getConnection(false, database))
									.then(hitch(this, function(table) {
								var db = table.database;
								if (table) {
									var schema;
									if ((schema = this.schemas[db]) == null) {
										schema = this.schemas[db] = {};
									}
									//put the schema under the right database
									schema[tableName] = table;
								}
								promise.callback(table);
							}), hitch(promise, "errback"));
						} else {
							promise.callback(schema[tableName]);
						}
					} else {
						LOGGER.debug("SCHEMA LOAD DEFERRED");
						this.__deferredSchemas.push(tableName);
					}
					return promise;
				},


				/**
				 * Use to load a group of tables.
				 * @example
				 * //load from the default database
				 *  moose.loadSchemas(["testTable", "testTable2", ....]).then(function(schema1, schema2,....){
				 *     moose.addModel(schema1, ...);
				 *     moose.addModel(schema2, ...);
				 * });
				 *
				 * //load schemas from a particular db
				 * moose.loadShemas(["table1", "table2"], "yourDb").then(function(table1, table2){
				 *     //do something...
				 * });
				 * //load table from multiple databases
				 * moose.loadSchemas({db1 : ["table1","table2"], db2 : ["table3","table4"]}).then(function(table1,table2, table3,table4){
				 *          //do something....
				 * });
				 *
				 *
				 * @param {Array<String>|Object} tableNames
				 *    <ul>
				 *        <li>If an array of strings is used they are assumed to be all from the same database.</li>
				 *        <li>If an object is passed the key is assumed to be the database, and the value should be an array of strings</li>
				 *    </ul>
				 *
				 * @param {String} [database] the database to retreive the table from, if not defined
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used
				 *
				 *
				 *
				 * @return {comb.Promise} A promise that is called back with the tables in the same order that they were contained in the array.
				 */
				loadSchemas : function(tableNames, database) {
					var ret = new Promise(), pl, ps;
					if (comb.isArray(tableNames)) {
						if (tableNames.length) {
							ps = tableNames.map(function(name) {
								return this.loadSchema(name, database);
							}, this);
							pl = new PromiseList(ps);
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
					} else if (comb.isObject((tableNames))) {
						ps = [];
						for (var i in tableNames) {
							//load the schemas
							ps.push(this.loadSchemas(tableNames[i], i));
						}
						pl = new PromiseList(ps).then(function(r) {
							var tables = [];
							r.forEach(function(ts) {
								//remove the first item
								ts.shift();
								tables.push.apply(tables, ts);
							});
							//apply it so they are called back as arguments;
							ret.callback.apply(ret, tables);
						}, comb.hitch(ret, "errback"));

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
				 *     <li>If a {@link moose.Table} is the first parameter then the {moose.Model} is returned immediately</li>
				 *     <li>If a table name is the first parameter then a {comb.Promise} is returned, and called back with the model once it is loaded</li>
				 * </ul>
				 *
				 * @example
				 *
				 *  moose.addModel(yourTable, {
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
				 *  //or
				 *
				 *  moose.addModel("myTable", {}).then(function(model){
				 *      //do something
				 *  });;
				 *
				 *  //or
				 *  moose.addModel("myTable", "myOtherDB").then(function(model){
				 *      //do something
				 *   });
				 *
				 *
				 * @param {String|moose.Table} table the table to be used as the base for this model.
				 * Factory for a new Model.
				 * @param {String} [database] the database to retreive the table from, if not defined
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used
				 *
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
				addModel : function(table, database, options) {
					var promise = new Promise(), m;
					if (table instanceof Table) {
						if (comb.isObject(database)) {
							options = database;
							database = this.client.database;
						}
						options = options || {};
						database = table.database || this.client.database,models;
						if (!(models = this.models[database])) {
							models = this.models[database] = {};
						}
						m = models[table.tableName] = model.create(table, this, options);
						return m;
					} else {
						if (connectionReady) {
							if (comb.isObject(database)) {
								options = database;
								database = this.client.database;
							}
							options = options || {};
							var models;
							if (!(models = this.models[database])) {
								models = this.models[database] = {};
							}
							if (models[table]) {
								promise.callback(models[table]);
							} else {
								if (typeof table == "string") {
									var schemas = this.schemas[database];
									if (!schemas || !table in this.schemas[database]) {
										this.loadSchema(table, database).then(
												function(schema) {
													var m = (models[table] = model.create(schema, this, options));
													promise.callback(m);
												}, hitch(promise, "errback"));
									} else {
										m = (models[table] = model.create(schemas[table], this, options));
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
				 * @param {String} [database] the database the table resides in.
				 *                           If database is not provided then the default database is assumed.
				 *
				 * @return {moose.Table} return the table or null of it is not found.
				 */
				getSchema : function(tableName, database) {
					var m = null;
					var db = database || this.client.database;
					var schema = this.schemas[db];
					if (schema) {
						if (tableName in schema) {
							m = schema[tableName];
						}
					}
					return m;
				},

				/**
				 * Retrieve an already created model.
				 *
				 * @param {String} tableName the name of the table the model wraps.
				 * @param {String} [database] the database the model is part of. This typically is only used if the
				 *                            models table is in a database other than the default.
				 *                            then the default database from {@link moose#createConnection}
				 *                            will be used
				 *
				 *
				 * @return {moose.Model} return the model or null of it is not found.
				 */
				getModel : function(tableName, database) {
					var m = null;
					var db = database || this.client.database;
					var models = this.models[db];
					if (models) {
						if (tableName in models) {
							m = models[tableName];
						}
					}
					return m;
				},

				/**@ignore*/
				getters : {
					adapter : function() {
						return adapters[this.type];
					},

					database : function(){
						return connectionReady ? this.client.database : null;
					}
				},


				/**@ignore*/
				setters : {
					database : function(database) {
						if (connectionReady) {
							this.client.database = database;
						}
					}
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