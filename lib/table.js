var comb = require("comb");
var moose, adapter;
var convert = function(op) {
	return function() {
		var columns = this.columns;
		var args = Array.prototype.slice.call(arguments);
		if (args.length > 1) {
			var columnName = args[0], val = args[1];
			this.validate(columnName, val);
			return columns[columnName][op](val);
		} else {
			var object = args[0];
			if (op == "toSql") this.validate(object);
			var ret = {};
			for (var i in object) {
				if (i in columns) {
					ret[i] = columns[i][op](object[i]);
				} else {
					ret[i] = object[i];
				}
			}
			return ret;

		}
	};
};


/**
 * @class Represents a table in a Database. This class is used to update, create, alter... tables.
 * The Class is typically used in migrations, or wrapped by a {@link moose.Model}.
 *
 * @example
 *
 * //To load preexisting Table use moose.loadSchema
 *
 * moose.loadSchema("employee").then(function(employee){});
 *
 * //Table creation example
 *
 * var types = moose.adapters.mysql.types;
 *
 * var employee = new moose.Table("employee", {
 *    id : types.INT({allowNull : false, autoIncrement : true}),
 *    firstname : types.VARCHAR({length : 20, allowNull : false}),
 *    lastname : types.VARCHAR({length : 20, allowNull : false}),
 *    midinitial : types.CHAR({length : 1}),
 *    gender : types.ENUM({enums : ["M", "F"], allowNull : false}),
 *    street : types.VARCHAR({length : 50, allowNull : false}),
 *    city : types.VARCHAR({length : 20, allowNull : false}),
 *    primaryKey : "id"
 * });
 *
 * //or use through migration
 *
 *moose.createTable("employee", function(table) {
 *    table.column("id", types.INT({allowNull : false, autoIncrement : true}));
 *    table.column("firstname", types.VARCHAR({length : 20, allowNull : false}));
 *    table.column("lastname", types.VARCHAR({length : 20, allowNull : false}));
 *    table.column("midinitial", types.CHAR({length : 1}));
 *    table.column("gender", types.ENUM({enums : ["M", "F"], allowNull : false}));
 *    table.column("street", types.VARCHAR({length : 50, allowNull : false}));
 *    table.column("city", types.VARCHAR({length : 20, allowNull : false}));
 *    table.primaryKey("id");
 *});
 *
 * //alter table examples
 *
 *  employee.rename("employeeTwo");
 *  employee.addColumn("age", types.INT());
 *  employee.addUnique(["firstname", "midinitial"]);
 *
 * //use through migration
 *
 * moose.alterTable("company", function(table) {
 *      table.rename("companyNew");
 *      table.addUnique("companyName");
 *      table.addColumn("employeeCount", types.INT());
 *      table.addUnique(["companyName", "employeeCount"]);
 *});
 *
 * //to drop a table use moose.dropTable
 *
 * moose.dropTable("company");
 * moose.dropTable("employee");
 *
 *
 * @param {String} tableName the name of the table
 * @param {Object} properties properties to describe the table, all properties excpet for type, and primaryKey will be interpreted as columns
 *          each property should be a type described by the particular adapter (i.e {@link moose.adapters.mysql.types}).
 * @param {String} [properties.type="mysql"] the type of database the table resides in.
 * @param {String|Array} properties.primaryKey the primary key of the table.
 *
 * @property {Object} columns the columns contained in this table.
 * @property {String} createTableSql valid create table SQL for this table.
 * @property {String} alterTableSql valid alter table SQL for this table.
 * @property {String} dropTableSql valid drop table SQL for this table.
 * @property {String} database the schema of the table resides in.
 *
 *
 * @name  Table
 * @memberOf moose

 */
exports.Table = (comb.define(null, {
			instance : {

				/**@lends moose.Table.prototype*/

				tableName : null,

				type : null,

				foreignKeys : null,


				constructor : function(tableName, properties) {
					if (!moose) {
						moose = require("./index"),adapter = moose.adapter;
					}
					if (!tableName) throw new Error("Table name required for schema");
					properties = properties || {};
					this.foreignKeys = [];
					this.uniqueSql = [];
					this.pk = null;
					this.__alteredColumns = {};
					this.__addColumns = {};
					this.__dropColumns = [];
					this.__addColumns = {};
					this.__newName = null;
					// pull it out then define our columns then check the primary key
					var db = properties.database;
					delete properties.database;
					if (db) {
						this.database = db;
					}
					var pk = properties.primaryKey;
					delete properties.primaryKey;
					this.primaryKeySql = null;
					this.tableName = tableName;
					this.__columns = columns = {};
					for (var i in properties) {
						this.column(i, properties[i]);
					}
					if (pk) {
						this.primaryKey(pk);
					}
				},

				/**
				 * Set the engine that the table should leverage.
				 * <br/>
				 * <b>Not all databases support this property</b>
				 *
				 * @param {String} engine the name of the engine.
				 */
				engine : function(engine) {
					this.__engine = engine;
				},


				/**
				 * Add a column to this table.
				 *
				 * <p><b>This is only valid on new tables.</b></p>
				 *
				 * @param {String} name the name of the column to be created.
				 * @param {moose.adapters.Type} options a type specific to the adpater that this table uses
				 */
				column : function(name, options) {
					if (adapter.isValidType(options)) {
						this.__columns[name] = options;
					} else {
						throw new Error("When adding a column the type must be a type object");
					}
				},

				/**
				 * Adds a foreign key to this table, see {@link moose.adapters.mysql.foreignKey}
				 *
				 * <p><b>This is only valid on new tables.</b></p>
				 *
				 *
				 */
				foreignKey : function(name, options) {
					this.foreignKeys.push(adapter.foreignKey(name, options));
				},

				/**
				 * Adds a primary key to this table, see {@link moose.adapters.mysql.primaryKey}
				 *
				 * <p><b>This is only valid on new tables.</b></p>
				 *
				 * @param {Array | String} name the name or names to assign to a primary key.
				 *
				 */
				primaryKey : function(name) {
					var isValid = false;
					if (name instanceof Array && name.length)
						if (name.length == 1) {
							return this.primaryKey(name[0]);
						} else {
							isValid = name.every(function(n) {
								if (this.isInTable(n)) {
									this.columns[n].primaryKey = true;
									return true;
								} else {
									return false;
								}
							}, this);
							this.pk = name;
						}
					else {
						isValid = this.isInTable(name);
						isValid && (this.columns[name].primaryKey = true);
						this.pk = name;
					}
					if (isValid) {
						this.primaryKeySql = adapter.primaryKey(name);
					} else {
						throw new Error("Primary key is not in the table");
					}
				},

				/**
				 * Adds a unique constraint to this table, see {@link moose.adapters.mysql.unique}
				 *
				 * <p><b>This is only valid on new tables.</b></p>
				 *
				 *
				 */
				unique : function(name) {
					var isValid = false;
					if (name instanceof Array && name.length)
						if (name.length == 1) {
							return this.unique(name[0]);
						} else {
							isValid = name.every(function(n) {
								if (this.isInTable(n)) {
									this.columns[n].unique = true;
									return true;
								} else {
									return false;
								}
							}, this);
						}
					else {
						isValid = this.isInTable(name);
						isValid && (this.columns[name].unique = true);
					}
					if (isValid) {
						this.uniqueSql.push(adapter.unique(name));
					} else {
						throw new Error("Unique key is not in the table");
					}
				},

				/**
				 * Takes a columnName and determines if it is in the table.
				 *
				 * @param {String} columnName the name of the column.
				 *
				 * @return {Boolean} true if the columnd is in the table.
				 */
				isInTable : function(columnName) {
					return (columnName in this.__columns);
				},

				/**
				 * Validate an object or columns and value against the columns in this table.
				 *
				 * @param {String|Object} name If the name is a string it is assumed to be the name of the column.
				 *                              If the name is an object it is assumed to be a an object consiting of {columnName : value}.
				 * @param {*} value if a string is the first argument to validate is a string then the value is compared against the type of the column contained in this table.
				 *
				 * @return {Boolean} true if the column/s are valid.
				 */
				validate : function() {
					var args = Array.prototype.slice.call(arguments);
					var columns = this.columns;
					self = this;
					function validateValue(columnName, value) {
						if (!columnName) throw new Error("columnName required");
						if (value == "undefined") value = null;
						if (self.isInTable(columnName)) {
							return columns[columnName].check(value);
						} else {
							throw new Error(columnName + " is not in table");
						}
					}

					if (args.length > 1) {
						return validateValue(args[0], args[1]);
					} else {
						var object = args[0];
						if (!comb.isObject(object)) throw new Error("object is required");
						for (var i in object) {
							validateValue(i, object[i]);
						}
						return true;
					}
				},

				/**
				 * Adds a column to this table.
				 *
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 *
				 * @param {String} name the name of the column to add.
				 * @param {moose.adapters.mysql.Type} options the type information of the column.
				 */
				addColumn : function(name, options) {
					if (adapter.isValidType(options)) {
						this.__addColumns[name] = options;
					} else {
						throw new Error("When adding a column the type must be a Type object");
					}
				},

				/**
				 * Drops a column from this table.
				 *
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 *
				 * @param {String} name the name of the column to drop.
				 */
				dropColumn : function(name) {
					if (this.isInTable(name)) {
						this.__dropColumns.push(name);
					} else {
						throw new Error(name + " is not in table " + this.tableName);
					}
				},

				/**
				 * Renames a column contained in this table.
				 *
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 *
				 * @param {String} name the name of the column to rename.
				 * @param {String} newName the new name of the column.
				 */
				renameColumn : function(name, newName) {
					if (this.isInTable(name)) {
						var column = this.__alteredColumns[name];
						if (!column) {
							column = this.__alteredColumns[name] = {original : this.__columns[name]};
						}
						column.newName = newName;
					} else {
						throw new Error(name + " is not in table " + this.tableName);
					}
				},

				/**
				 * Set the default value of a column.
				 *
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 *
				 * @param {String} name the name of the column to alter.
				 * @param {*} defaultvalue the value to set as the default of the column.
				 */
				setColumnDefault : function(name, defaultvalue) {
					if (this.isInTable(name)) {
						var column = this.__alteredColumns[name];
						if (!column) {
							column = this.__alteredColumns[name] = {original : this.__columns[name]};
						}
						column["default"] = defaultvalue;
					} else {
						throw new Error(name + " is not in table " + this.tableName);
					}
				},

				/**
				 * Set a new type on a column contained in this table.
				 *
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 *
				 * @param {String} name the name of the column to alter.
				 * @param {moose.adapters.mysql.Type} options the new type information of the column.
				 */
				setColumnType : function(name, type) {
					if (adapter.isValidType(type) && this.isInTable(name)) {
						var column = this.__alteredColumns[name];
						if (!column) {
							column = this.__alteredColumns[name] = {original : this.__columns[name]};
						}
						column.type = type;
					} else {
						throw new Error(name + " is not in table " + this.tableName);
					}
				},

				/**
				 * Set if a column should allow null.
				 *
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 *
				 * @param {String} name the name of the column to alter.
				 * @param {Boolean} allowNull true if null is allowed, false otherwise.
				 */
				setAllowNull : function(name, allowNull) {
					if (this.isInTable(name)) {
						var column = this.__alteredColumns[name];
						if (!column) {
							column = this.__alteredColumns[name] = {original : this.__columns[name]};
						}
						column.allowNull = allowNull;
					} else {
						throw new Error(name + " is not in table " + this.tableName);
					}
				},

				/**
				 * Replace the current primary key, see {@link moose.adapters.mysql.addPrimaryKey}.
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 */
				addPrimaryKey : function() {
					if (this.pk) {
						this.dropPrimaryKey(this.pk);
					}
					this.addPrimaryKeySql = adapter.addPrimaryKey.apply(adapter, arguments);
				},

				/**
				 * Drop current primary key, see {@link moose.adapters.mysql.dropPrimaryKey}.
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 */
				dropPrimaryKey : function() {
					this.pk = null;
					this.dropPrimaryKeySql = adapter.dropPrimaryKey.apply(adapter, arguments);
				},

				/**
				 * Add a foreign key to this table, see {@link moose.adapters.mysql.addForeignKey}.
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 */

				addForeignKey : function() {
					this.foreignKeys.push(adapter.addForeignKey.apply(adapter, arguments));
				},

				/**
				 * Drop a foreign key on this table, see {@link moose.adapters.mysql.dropForeignKey}.
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 */
				dropForeignKey : function() {
					this.foreignKeys.push(adapter.dropForeignKey.apply(adapter, arguments));
				},

				/**
				 * Add a unique constraint to this table, see {@link moose.adapters.mysql.addUnique}.
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 */

				addUnique : function() {
					this.uniqueSql.push(adapter.addUnique.apply(adapter, arguments));
				},

				/**
				 * Drop a unique constraint on this table, see {@link moose.adapters.mysql.dropUnique}.
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 */
				dropUnique : function() {
					this.uniqueSql.push(adapter.dropUnique.apply(adapter, arguments));
				},

				/**
				 * Rename this table.
				 * <p><b>This is only valid on previously saved tables.</b></p>
				 * @param {String} newName the new table name.
				 */
				rename : function(newName) {
					this.__newName = newName;
				},

				/**
				 *
				 * @function
				 * Convert an object or column and value to a valid sql value.
				 *
				 * @param {String|Object} name If the name is a string it is assumed to be the name of the column.
				 *                              If the name is an object it is assumed to be a an object consisting of {columnName : value}.
				 * @param {*} value if a string is the first argument, then the value is compared against the type of the column contained in this table.
				 *
				 * @return {String|Object} the sql value/s.
				 */
				toSql : convert("toSql"),

				/**
				 * Convert an object or column and value from a sql value.
				 *
				 * @function
				 * @param {String|Object} name If the name is a string it is assumed to be the name of the column.
				 *                              If the name is an object it is assumed to be a an object consisting of {columnName : value}.
				 * @param {*} value if a string is the first argument, then the value is compared against the type of the column contained in this table.
				 *
				 * @return {String|Object} the javascript value/s.
				 */
				fromSql : convert("fromSql"),

				setters : {
					database : function(database) {
						if (comb.isString(database)) {
							this.__database = database;
						} else {
							throw "moose.Table : when setting a database it must be a string.";
						}
					}
				},

				getters : {

					database : function() {
						return this.__database;
					},

					columns : function() {
						return this.__columns;
					},

					createTableSql : function() {
						var sql = "CREATE TABLE " + this.tableName + "(";
						var columns = this.columns;
						var columnSql = [];
						for (var i in columns) {
							columnSql.push(adapter.column(i, columns[i]));
						}
						sql += columnSql.join(",");
						if (this.primaryKeySql) sql += ", " + this.primaryKeySql;
						if (this.foreignKeys.length) sql += ", " + this.foreignKeys.join(",");
						if (this.uniqueSql.length) sql += ", " + this.uniqueSql.join(","),needComma = true;
						if (this.__engine) {
							sql += ") ENGINE=" + this.__engine + ";";
						} else {
							sql += ");";
						}
						return sql;
					},

					alterTableSql : function() {
						var sql = "ALTER TABLE " + this.tableName, needComma = false;
						if (this.__newName) {
							sql += " RENAME " + this.__newName;
							needComma = true;
						}
						var addColumns = this.__addColumns, addColumnsSql = [];
						var dropColumns = this.__dropColumns, dropColumnsSql = [];
						var alteredColumns = this.__alteredColumns, alterColumnsSql = [];
						for (var i in addColumns) {
							addColumnsSql.push(adapter.addColumn(i, addColumns[i]));
						}
						if (addColumnsSql.length) {
							sql += (needComma ? " , " : " ") + addColumnsSql.join(" ,");
							needComma = true;
						}
						if (dropColumns.length) {
							for (i in dropColumns) {
								dropColumnsSql.push(adapter.dropColumn(dropColumns[i]));
							}
							sql += (needComma ? " , " : " ") + dropColumnsSql.join(" ,"),needComma = true;
						}
						for (i in alteredColumns) {
							alterColumnsSql.push(adapter.alterColumn(i, alteredColumns[i]));
						}
						if (alterColumnsSql.length) {
							sql += (needComma ? " , " : " ") + alterColumnsSql.join(",");
							needComma = true;
						}

						if (this.dropPrimaryKeySql) {
							sql += (needComma ? " , " : " ") + this.dropPrimaryKeySql;
							needComma = true;
						}
						if (this.addPrimaryKeySql) {
							sql += (needComma ? " , " : " ") + this.addPrimaryKeySql;
							needComma = true;
						}
						if (this.foreignKeys.length) {
							sql += (needComma ? " , " : " ") + this.foreignKeys.join(",");
							needComma = true;
						}
						if (this.uniqueSql.length) {
							sql += (needComma ? " , " : " ") + this.uniqueSql.join(",");
							needComma = true;
						}
						sql += ";";
						return sql;
					},

					dropTableSql : function() {
						return "DROP TABLE IF EXISTS " + this.tableName;
					}
				}

			}
		}));


