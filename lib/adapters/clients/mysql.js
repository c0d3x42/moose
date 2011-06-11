var mysql = require("mysql"),
		comb = require("comb"),
		hitch = comb.hitch,
		Promise = comb.Promise,
		PromiseList = comb.PromiseList,
		ConnectionPool = require("./ConnectionPool");
//MySQLPool = require("mysql-pool").MySQLPool;


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

var LOGGER = comb.logging.Logger.getLogger("comb.adapters.mysql.client");

/**
 * @class MySQL Client wrapper to standardize queries.
 *
 * <b>NOTE this class is not publicly exposed, but returned from calling getConnection on {@link moose.getConnection}</b>
 *
 * @name Query
 * @memberOf moose.adapters.client.mysql
 *
 * @param {moose.adapters.mysql.ConnectionPool} pool the pool to retrieve connections from.
 * @param {Boolean} forceClose=false whether or not to force close the connection
 * @param {String} [database] the database to connect to when querying.
 *
 * @property {String} database the name of the database the query is currently using.
 */
var Query = comb.define(null, {
			instance : {
				/**@lends moose.adapters.client.mysql.Query.prototype*/

				constructor : function(pool, forceClose, database) {
					if (!pool) throw "Query : Pool required to query";
					if(database){
						LOGGER.debug("QUERY DB = " + database)
						this.database = database;
					}
					this.pool = pool;
					this.forceClose = forceClose;
					this._ended = false;
				},

				__query : function(query) {
					var ret = new Promise();
					this.connection.query(query, hitch(this, function(err, results, info) {
						var conn = this.connection;
						this.connection = null;
						if (this.forceClose) {
							conn.end(hitch(this, function() {
								if (err) {
									ret.errback(err);
								} else {
									ret.callback(results, info);
								}
								this.pool.removeConnection(conn);
							}));
						} else {
							this.pool.returnConnection(conn);
							if (err) {
								ret.errback(err);
							} else {
								ret.callback(results, info);
							}
						}
					}));
					return ret;
				},

				/**
				 * Queries the database.
				 *
				 * @param {String} query query to perform
				 *
				 * @return {comb.Promise} promise that is called back with the results, or error backs with an error.
				 */
				query : function(query) {
					if (!this._ended) {
						var ret = new Promise();
						if (!this.connection) {
							this.pool.getConnection().then(hitch(this, function(conn) {
								this.connection = conn;
								this.query(query).then(hitch(ret, "callback"), hitch(ret, "errback"));
							}));
						} else {
							var conn = this.connection;
							if (this.__setDatabase && this.__database != conn.database) {
								this.connection.useDatabase(this.__database, hitch(this, function(err) {
									this.__setDatabase = false;
									this.connection.database = this.__database;
									if (err) {
										ret.errback(err);
									} else {
										this.__query(query).then(hitch(ret, "callback"), hitch(ret, "errback"));
									}
								}));
							} else {
								this.__query(query).then(hitch(ret, "callback"), hitch(ret, "errback"));
							}
						}
					} else {
						throw new Error("Query has already been closed");
					}
					return ret;
				},

				/**@ignore*/
				setters : {
					database : function(database) {
						if (comb.isString(database) && database != this.__database && !this._ended) {
							this.__setDatabase = true;
							this.__database = database;
						}
					}
				},

				/**@ignore*/
				getters : {
					database : function(){
						return this.__database;
					}
				}
			}
		});


/**
 * @class Sub class of query to handle transaction based queries.
 *
 * <b>NOTE this class is not publicly exposed, but returned from calling getConnection on {@link moose.transaction}</b>
 *
 * @name TransactionQuery
 * @augemtns moose.adapters.client.mysql.Query
 * @memberOf moose.adapters.client.mysql
 *
 * @param {moose.adapters.mysql.ConnectionPool} pool the pool to retrieve connections from.
 * @param {Boolean} forceClose=false whether or not to force close the connection
 * @param {String} [database] the database to connect to when querying.
 */
var TransactionQuery = comb.define(Query, {
			instance : {
				 /**@lends moose.adapters.client.mysql.TransactionQuery.prototype*/

				__query : function(query) {
					var ret = new Promise();
					this.connection.query(query, hitch(this, function(err, results, info) {
						if (err) {
							this.connection.clean = false;
							ret.errback(err);
						} else {
							ret.callback(results, info);
						}
					}));
					return ret;
				},

				query : function(query, args) {
					if (this.connection && !this.connection.clean) {
						throw new Error("Cannot commit a transaction with an error");
						return;
					}
					return this.super(arguments);
				},

				/**
				 * Call to commit a transaction.
				 *
				 * @return {comb.Promise} called back after the commit has finished.
				 */
				commit: function() {
					var ret = new Promise();
					this.query("COMMIT").then(hitch(this, function(res) {
						this.connection.end();
						this.pool.removeConnection(this.connection);
						this.connection = null;
						ret.callback(res);
					}), hitch(ret, "errback"));
					return ret;
				},

				abort: function() {
					var ret = new Promise();
					this.query("ROLLBACK").then(hitch(this, function() {
						this.connection.end();
						this.pool.removeConnection(this.connection);
						this.connection = null;
						ret.callback();
					}), hitch(ret, "errback"));
					return ret;
				},

				/**
				 * Call to rollback a transaction.
				 *
				 * @return {comb.Promise} called back after the rollback has finished.
				 */
				rollback : function() {
					return this.abort();
				}
			}
		});

/**
 * @class MySQL connection pool class. This class is not used directly.
 *
 *
 * @name ConnectionPool
 * @augments moose.adapters.client.ConnectionPool
 * @memberOf moose.adapters.client.mysql
 */
var MysqlConnectionPool = (exports.ConnectionPool = comb.define(ConnectionPool, {
			instance : {

				createConnection : function() {
					var conn = new mysql.Client(this._options);
					conn.clean = true;
					conn.connect();
					return conn;
				},

				closeConnection : function(conn) {
					var ret = new Promise();
					conn.end(function() {
						ret.callback();
					});

					return ret;
				},

				validate : function(conn) {
					var ret = new Promise();
					if (!conn.clean || conn.ending) {
						ret.callback(false);
					} else if (!conn.database || conn.database != this.database) {
						//reset to the default database.
						conn.useDatabase(this.database, function(err) {
							if (err) {
								ret.callback(false);
							} else {
								conn.database = this.database;
								ret.callback(true);
							}
						});
					} else {
						ret.callback(true);
					}
					return ret;
				}
			}
		}));

/**
 * @class Manages mysql connections. This class manages the creation of a connection pool,
 * and is the class that retrieves/creates connections to be used my moose.
 *
 * @name Client
 * @memberOf moose.adapters.client
 */
exports.Client = comb.define(null, {
			instance : {
				/**@lends moose.adapters.client.Client.prototype*/

				minConnections : null,

				constructor : function(options) {
					this.options = options || {};
					this.database = options.database;
					this.maxConnections = typeof options.maxConnections == "number" ? options.maxConnections : 10;
					this.pool = new MysqlConnectionPool(options);
				},

				/**
				 * Executes a query with the given sql and database.
				 * @param {String} sql the sql to execute
				 * @param {String} [database] the name of the database to execute the query on.
				 *
				 * @return {comb.Promise} a promise that is called back with the results.
				 */
				query : function(sql, database) {
					var q = new Query(this.pool, false, database || this.database);
					return q.query(sql);
				},

				/**
				 * Retrieces a connection from the connection pool.
				 *
				 * @param {boolean} [forceClose=false] whether or not to close the connection after the query is done.
				 *                                     this is typically not needed.
				 * @param [String] [database] the name of the database to connection to.
				 *
				 * @return {Query} the query object to perform queries on.
				 */
				getConnection : function(forceClose, database) {
					LOGGER.debug("GET CONNECTION DB = " + database + " " + this.database);
					return new Query(this.pool, forceClose, (database || this.database));
				},

				/**
				 * Retrieves a transaction query to perform a transaction on.
				 *
				 * @param {String} database the name of the database to perform the transaction on.
				 */
				transaction: function(database) {
					var conn = new TransactionQuery(this.pool, false, database || this.database);
					conn.query('START TRANSACTION').addErrback(hitch(null, throwError, 'start transaction'));
					return conn;
				},

				/**
				 * Closes all connections.
				 *
				 * @return {comb.Promise} called back once all queries are done, or calls errback if an error occurs.
				 */
				close : function() {
					var ret = new Promise();
					this.pool.endAll(hitch(this, function(err) {
						this.pool = null;
						if (err) {
							LOGGER.error("Error closing connections");
							ret.errback(err);
						} else {
							ret.callback();
						}
					}));
					return ret;
				},

				/**@ignore*/
				setters : {
					database : function(database) {
						if (comb.isString(database)) {
							this.__defaultDatabase = database;
						} else {
							throw "moose.adapters.mysql.Client : Database required";
						}
					}
				},

				/**@ignore*/
				getters : {
					database : function() {
						return this.__defaultDatabase;
					}
				}
			}
		});
