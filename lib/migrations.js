var comb = require("comb"),
		logging = comb.logging,
		Logger = logging.Logger,
		LOGGER = Logger.getLogger("comb.migrations");
		hitch = comb.hitch,
		Promise = comb.Promise,
		PromiseList = comb.PromiseList,
		fs = require("fs"),
		path = require("path"),
		tables = require("./table"),
		Table = tables.Table;

/**
 *@class This is a plugin for moose to add migration functionality.
 * Migrations are the preferred way of handling table creation, deletion, and altering.
 * <p>Adds
 * <ul>
 *     <li>migrate - perform a migration</li>
 *     <li>createTable - to create a new table</li>
 *     <li>dropTable - drop a table</li>
 *     <li>alterTable - alter an existing table</li>
 * </ul>
 *
 * Migrations are done through files contained in a particular directory, the directory should only contain migrations.
 * In order for moose to determine which versions to use
 * the file names must end in <versionNumber>.js where versionNumber is a integer value representing the version num.
 * An example directory structure might look like the following:
 *
 * <pre class="code">
 * -migrations
 *      - createFirstTables.1.js
 *      - shortDescription.2.js
 *      - another.3.js
 *      .
 *      .
 *      .
 *      -lastMigration.n.js
 * </pre>
 *
 * In order to easily identify where certain schema alterations have taken place it is a good idea to provide a brief
 * but meaningful migration name.
 *
 * createEmployee.1.js
 * </br>
 *
 * In order to run a migraton all one has to do is call moose.migrate(options);
 *
 * <pre class="code">
 *  moose.migrate({
 *               connection : {user : "test", password : "testpass", database : 'test'}, //Connection information to connect to the database.
 *               dir : "location of migrations", //Location of the directory containing the migrations.
 *               start : 0,//What version to start migrating at.
 *               end : 0,  //What version to stop migrations at.
 *               up : true //set to true to go up in migrations, false to rollback
 *  });
 * </pre>
 *
 * <p>Example migration file</b>
 * <pre class="code">
 *
 * //Up function used to migrate up a version
 * exports.up = function() {
 *   //create a new table
 *   moose.createTable("company", function(table) {
 *       //the table instance is passed in.
 *       //add columns
 *       table.column("id", types.INT({allowNull : false, autoIncrement : true}));
 *       table.column("companyName", types.VARCHAR({length : 20, allowNull : false}));
 *       //set the primary key
 *       table.primaryKey("id");
 *   });
 *   moose.createTable("employee", function(table) {
 *       table.column("id", types.INT({allowNull : false, autoIncrement : true}));
 *       table.column("firstname", types.VARCHAR({length : 20, allowNull : false}));
 *       table.column("lastname", types.VARCHAR({length : 20, allowNull : false}));
 *       table.column("midinitial", types.CHAR({length : 1}));
 *       table.column("gender", types.ENUM({enums : ["M", "F"], allowNull : false}));
 *       table.column("street", types.VARCHAR({length : 50, allowNull : false}));
 *       table.column("city", types.VARCHAR({length : 20, allowNull : false}));
 *       table.primaryKey("id");
 *   });
 *
 *   moose.createTable("companyEmployee", function(table) {
 *       table.column("companyId", types.INT({allowNull : false}));
 *       table.column("employeeId", types.INT({allowNull : false}));
 *       table.primaryKey(["companyId", "employeeId"]);
 *       table.foreignKey({companyId : {company : "id"}, employeeId : {employee : "id"}});
 *   });
 *   moose.createTable("works", function(table) {
 *       table.column("id", types.INT({allowNull : false, autoIncrement : true}));
 *       table.column("eid", types.INT({allowNull : false}));
 *       table.column("companyName", types.VARCHAR({length : 20, allowNull : false}));
 *       table.column("salary", types.DOUBLE({size : 8, digits : 2, allowNull : false}));
 *       table.primaryKey("id");
 *       table.foreignKey("eid", {employee : "id"});
 *
 *   });
 *};
 *
 * //Down function used to migrate down version
 *exports.down = function() {
 *    moose.dropTable("companyEmployee");
 *    moose.dropTable("works");
 *    moose.dropTable("employee");
 *    moose.dropTable("company");
 *};
 * </pre>
 *@name Migrations
 *
 * */
module.exports = exports = comb.define(null, {
			instance : {
				/**@lends Migrations.prototype*/


				constructor : function() {
					this.__deferredMigrations = [];
				},

				/**
				 * Performs the deferred migrations function
				 *
				 * Used by create/drop/alter Table functions when within a migraton
				 * */
				__migrateFun : function(fun, table) {
					var ret = new Promise();
					var adapter = this.adapter;
					var conn = this.getConnection(false, table.database);
					adapter[fun](table, conn).then(hitch(ret, "callback"), hitch(ret, "errback"));
					delete this.schemas[table.database || this.client.database][table.tableName];
					return ret;
				},

				/**
				 * <p>Creates a new table. This function should be used while performing a migration.</p>
				 * <p>If the table should be created in another DB then the table should have the database set on it.</p>
				 *
				 * @example
				 * //default database table creation
				 * moose.createTable("test", function(table){
				 *     table.column("id", types.INT())
				 *     table.primaryKey("id");
				 * });
				 *
				 * //create a table in another database
				 * moose.createTable("test", function(table){
				 *     table.database = "otherDB";
				 *     table.column("id", types.INT())
				 *     table.primaryKey("id");
				 * });
				 *
				 *
				 * @param {String} tableName the name of the table to create
				 * @param {Funciton} cb this funciton is callback with the table
				 *      - All table properties should be specified within this block
				 *
				 * @return {comb.Promise} There are two different results that the promise can be called back with.
				 * <ol>
				 *     <li>If a migration is currently being performed then the promise is called back with a
				 *     function that should be called to actually perform the migration.</li>
				 *     <li>If the called outside of a migration then the table is created immediately and
				 *     the promise is called back with the result.</li>
				 * </ol>
				 *
				 * */
				createTable : function(tableName, cb) {
					var table = new Table(tableName, {});
					cb(table);
					//add it to the moose schema map
					var db = table.database || this.client.database, schema;
					if ((schema = this.schemas[db]) == null) {
						schema = this.schemas[db] = {};
					}
					schema[tableName] = table;
					if (!this.__inMigration) {
						return this.__migrateFun("createTable", table);
					} else {
						var ret = new Promise();
						ret.callback(hitch(this, "__migrateFun", "createTable", table));
						this.__deferredMigrations.push(ret);
						return ret;
					}
				},


				/**
				 * Drops a table
				 *
				 * @example
				 *
				 * //drop table in default database
				 * moose.dropTable("test");
				 *
				 * //drop table in another database.
				 * moose.dropTable("test", "otherDB");
				 *
				 * @param {String} table the name of the table
				 * @param {String} [database] the database that the table resides in, if a database is not
				 *                            provided then the default database is used.
				 * @return {comb.Promise} There are two different results that the promise can be called back with.
				 * <ol>
				 *     <li>If a migration is currently being performed then the promise is called back with a
				 *     function that should be called to actually perform the migration.</li>
				 *     <li>If the called outside of a migration then the table is dropped immediately and
				 *     the promise is called back with the result.</li>
				 * </ol>
				 **/
				dropTable : function(table, database) {
					table = new Table(table, {database : database});
					//delete from the moose schema map
					var db = database || this.client.database;
					var schema = this.schemas[db];
					if (schema && table in schema) {
						delete schema[table];
					}
					if (!this.__inMigration) {
						return this.__migrateFun("dropTable", table);
					} else {
						var ret = new Promise();
						ret.callback(hitch(this, "__migrateFun", "dropTable", table));
						this.__deferredMigrations.push(ret);
						return ret;
					}
				},

				/**
				 * Alters a table
				 *
				 * @example :
				 *
				 * //alter table in default database
				 * moose.alterTable("test", function(table){
				 *     table.rename("test2");
				 *     table.addColumn("myColumn", types.STRING());
				 * });
				 *
				 * //alter table in another database
				 * moose.alterTable("test", "otherDB", function(table){
				 *     table.rename("test2");
				 *     table.addColumn("myColumn", types.STRING());
				 * });
				 *
				 * @param {String} name The name of the table to alter.
				 * @param {String} [database] the database that the table resides in, if a database is not
				 *                            provided then the default database is used.
				 * @param {Function} cb the function to execute with the table passed in as the first argument.
				 *
				 * @return {comb.Promise} There are two different results that the promise can be called back with.
				 * <ol>
				 *     <li>If a migration is currently being performed then the promise is called back with a
				 *     function that should be called to actually perform the migration.</li>
				 *     <li>If the called outside of a migration then the table is altered immediately and
				 *     the promise is called back with the result.</li>
				 * </ol>
				 * */
				alterTable : function(name, database, cb) {
					if (comb.isFunction(database)) {
						cb = database;
					}
					var ret = new Promise();
					var db = database || this.client.database;
					var schema = this.schemas[db];
					if (schema && name in schema) {
						delete schema[name];
					}
					if (!this.__inMigration) {
						this.loadSchema(name, db).then(function(table) {
							cb(table);
							this.__migrateFun("alterTable", table).then(hitch(ret, "callback"), hitch(ret, "errback"));
						}, hitch(ret, "errback"));
					} else {
						this.loadSchema(name, db).then(hitch(this, function(table) {
							cb(table);
							ret.callback(hitch(this, "__migrateFun", "alterTable", table));
							schema = this.schemas[db];
							if (schema && name in schema) {
								delete schema[name];
							}
						}), hitch(ret, "errback"));
						this.__deferredMigrations.push(ret);
						return ret;
					}
				},

				/**
				 * Performs the migration.
				 *
				 * @param {Function} fun the function to call to perform the migration
				 *                  this is an up or down function in a migration file, i.e. exports.up|down.
				 *
				 * @return {comb.Promise} called back after the migration completes, and the next can continue.
				 */
				__doMigrate : function(fun) {
					var ret = new Promise();
					this.__inMigration = true;
					fun();
					//all calls should be deferred
					if (this.__deferredMigrations.length) {
						var defList = new PromiseList(this.__deferredMigrations);
						defList.then(hitch(this, function(res) {
							this.__deferredMigrations.length = 0;
							//map my to retrieve the actual responses
							//and call the associated method
							var responses = [],	i = 0, len = res.length;
							var next = hitch(this, function(r) {
								responses.push(r);
								if (i < len) {
									f = res[i][1];
									f().then(next, function(err) {
										LOGGER.error(err);
									});
								} else {
									ret.callback(responses);
								}
								i++;
							});
							next();
							//reset for another migration
							//listen for the promises to complete
						}), function(err) {
							for (var len = err.length, i = len - 1; i > 0; i--) {
								LOGGER.error(err[i]);
							}
						});
					} else {
						ret.callback();
					}
					this.__inMigration = false;
					return ret;
				},

				/**
				 * Perform a migration.
				 *
				 * @example
				 *  moose.migrate({
				 *               connection : {user : "test", password : "testpass", database : 'test'}, //Connection information to connect to the database.
				 *               dir : "location of migrations", //Location of the directory containing the migrations.
				 *               start : 0,//What version to start migrating at.
				 *               end : 0,  //What version to stop migrations at.
				 *               up : true //set to true to go up in migrations, false to rollback
				 *  });

				 *
				 * <p><b>NOTE</b></br>
				 *  If you start at 0 and end at 0 your migrations will inlude the file only at "migrationName".0.js
				 *  if you specify start : 0 and end 1 then your migrations will include files "migraiton0".0.js and "migration1".1.js,
				 *  the names being whatever you specify before the *.0 and *.1
				 *  </p>

				 *
				 * <p>Example migration file</b>
				 * @example
				 *
				 * //Up function used to migrate up a version
				 * exports.up = function() {
				 *   //create a new table
				 *   moose.createTable("company", function(table) {
				 *       //the table instance is passed in.
				 *       //add columns
				 *       table.column("id", types.INT({allowNull : false, autoIncrement : true}));
				 *       table.column("companyName", types.VARCHAR({length : 20, allowNull : false}));
				 *       //set the primary key
				 *       table.primaryKey("id");
				 *   });
				 *   moose.createTable("employee", function(table) {
				 *       table.column("id", types.INT({allowNull : false, autoIncrement : true}));
				 *       table.column("firstname", types.VARCHAR({length : 20, allowNull : false}));
				 *       table.column("lastname", types.VARCHAR({length : 20, allowNull : false}));
				 *       table.column("midinitial", types.CHAR({length : 1}));
				 *       table.column("gender", types.ENUM({enums : ["M", "F"], allowNull : false}));
				 *       table.column("street", types.VARCHAR({length : 50, allowNull : false}));
				 *       table.column("city", types.VARCHAR({length : 20, allowNull : false}));
				 *       table.primaryKey("id");
				 *   });
				 *
				 *   moose.createTable("companyEmployee", function(table) {
				 *       table.column("companyId", types.INT({allowNull : false}));
				 *       table.column("employeeId", types.INT({allowNull : false}));
				 *       table.primaryKey(["companyId", "employeeId"]);
				 *       table.foreignKey({companyId : {company : "id"}, employeeId : {employee : "id"}});
				 *   });
				 *   moose.createTable("works", function(table) {
				 *       table.column("id", types.INT({allowNull : false, autoIncrement : true}));
				 *       table.column("eid", types.INT({allowNull : false}));
				 *       table.column("companyName", types.VARCHAR({length : 20, allowNull : false}));
				 *       table.column("salary", types.DOUBLE({size : 8, digits : 2, allowNull : false}));
				 *       table.primaryKey("id");
				 *       table.foreignKey("eid", {employee : "id"});
				 *
				 *   });
				 *};
				 *
				 * //Down function used to migrate down version
				 *exports.down = function() {
				 *    moose.dropTable("companyEmployee");
				 *    moose.dropTable("works");
				 *    moose.dropTable("employee");
				 *    moose.dropTable("company");
				 *};
				 *
				 * @param {Object} options the options to specify how to perform the migration.
				 * @param {Object} options.connection : @see moose.createConnection
				 * @param {String} options.dir Location of the directory where migrations are located.
				 * @param {Boolean} [options.up = true] If true will migrate up otherwise down.
				 * @param {Number} [options.start = 0] The migration to start at.
				 * @param {Number} [options.end=Infinity] The migration to end at this, end is inclusive
				 *
				 * @return {comb.Promise} Called back after all migrations have completed.
				 */
				migrate : function(options) {
					var promise = new Promise();
					var dir, file, migrationDir = comb.isBoolean(options.up) ? options.up : true;
					var start = typeof options.end == "number" ? options.start : 0,
							end = typeof options.end == "number" ? options.end : Infinity;

					//if a coonection is not provided or we dont already have a connection
					//throw an error
					if (options.connection || this.__connectionReady) {
						//set our current state, allows us to push any create/alter/delete
						//transactions into our deferred

						//init our connecton information
						!this.__connectionReady && this.createConnection(options.connection);
						if (options.dir) dir = path.resolve(process.cwd(), options.dir);
						//read the directory
						fs.readdir(dir, hitch(this, function(err, files) {
							var funs = [], fun = migrationDir ? "up" : "down", parts, num, file, extName = path.extname, baseName = path.basename;
							for (var i = 0, len = files.length; i < len; i++) {
								file = files[i];
								if (extName(file) == ".js") {
									//its a js file otherwise ignore
									//split the path to get the num
									parts = baseName(file, ".js").split(".");
									//get the migration number
									num = parseInt(parts.pop());
									//if it is a valid index
									if (!isNaN(num) && num >= start && num <= end) {
										var cls = require(path.resolve(dir, file));
										if (cls[fun]) {
											//add it
											funs[num - start] = hitch(cls, fun);
										}
									}
								}
							}
							if (!migrationDir) {
								funs.reverse();
							}
							if (funs.length) {
								i = 0,len = funs.length;
								var doMig = hitch(this, this.__doMigrate);
								var next = hitch(this, function(res) {
									if (i < len) {
										doMig(funs[i]).then(next, function(err) {
											LOGGER.log(err);
										});
									} else {
										promise.callback();
									}
									i++;
								});
								next();
							} else {
								promise.callback();
							}
						}));
					} else {
						throw new Error("when migrating a connection is required");
					}
					return promise;
				}

			}
		});