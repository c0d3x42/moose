var adapters = require("./adapters"),
        comb = require("comb");

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

exports.Table = (comb.define(null, {
    instance : {

        tableName : null,

        type : null,

        foreignKeys : null,

        constructor : function(tableName, properties) {
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
            var pk = properties.primaryKey;
            delete properties.primaryKey;
            this.primaryKeySql = null;
            this.tableName = tableName;
            this.__columns = columns = {};
            this.type = properties.type || "mysql";
            for (var i in properties) {
                this.column(i, properties[i]);
            }
            if (pk) {
                this.primaryKey(pk);
            }
        },

        engine : function(engine) {
            this.__engine = engine;
        },

        column : function(name, options) {
            if (adapters[this.type].isValidType(options)) {
                this.__columns[name] = options;
            } else {
                throw new Error("When adding a column the type must be a type object");
            }
        },

        foreignKey : function(name, options) {
            this.foreignKeys.push(adapters[this.type].foreignKey(name, options));
        },

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
                this.primaryKeySql = adapters[this.type].primaryKey(name);
            } else {
                throw new Error("Primary key is not in the table");
            }
        },

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
                this.uniqueSql.push(adapters[this.type].unique(name));
            } else {
                throw new Error("Unique key is not in the table");
            }
        },

        isInTable : function(columnName) {
            return (columnName in this.__columns);
        },

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

        addColumn : function(name, options) {
            if (adapters[this.type].isValidType(options)) {
                this.__addColumns[name] = options;
            } else {
                throw new Error("When adding a column the type must be a Type object");
            }
        },

        /*
         * dropColumn drops a column to a table
         */
        dropColumn : function(name) {
            if (this.isInTable(name)) {
                this.__dropColumns.push(name);
            } else {
                throw new Error(name + " is not in table " + this.tableName);
            }
        },

        /*
         * renameColumn adds a column to a table
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

        /*
         * setColumnDefault changes the default for a column
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

        /*
         * setColumnType set the columnType
         */
        setColumnType : function(name, type) {
            if (adapters[this.type].isValidType(type) && this.isInTable(name)) {
                var column = this.__alteredColumns[name];
                if (!column) {
                    column = this.__alteredColumns[name] = {original : this.__columns[name]};
                }
                column.type = type;
            } else {
                throw new Error(name + " is not in table " + this.tableName);
            }
        },

        // setAllowNull sets the allow null on a column
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

        /*
         * @see mysql.addPrimaryKey
         */
        addPrimaryKey : function() {
            if (this.pk) {
                this.dropPrimaryKey(this.pk);
            }
            this.addPrimaryKeySql = adapters[this.type].addPrimaryKey.apply(adapters[this.type], arguments);
        },

        /*
         * @see mysql.dropPrimaryKey
         */
        dropPrimaryKey : function() {
            this.pk = null;
            this.dropPrimaryKeySql = adapters[this.type].dropPrimaryKey.apply(adapters[this.type], arguments);
        },

        /*
         * @see mysql.addForeignKey
         */
        addForeignKey : function() {
            this.foreignKeys.push(adapters[this.type].addForeignKey.apply(adapters[this.type], arguments));
        },

        /*
         * @see mysql.addForeignKey
         */
        dropForeignKey : function() {
            this.foreignKeys.push(adapters[this.type].dropForeignKey.apply(adapters[this.type], arguments));
        },

        /*
         * @see mysql.dropForeignKey
         */
        addUnique : function() {
            this.uniqueSql.push(adapters[this.type].addUnique.apply(adapters[this.type], arguments));
        },

        /*
         * @see mysql.dropForeignKey
         */
        dropUnique : function() {
            this.uniqueSql.push(adapters[this.type].dropUnique.apply(adapters[this.type], arguments));
        },

        /*
         * @see Table.foreignKey
         *
         * addIndex : function() { },
         *  /* dropIndex drops an index on a column
         *
         * dropIndex : function() { },
         *  /* addFullTextIndex adds a fulltext Index
         *
         * addFullTextIndex : function() { },
         */


        rename : function(newName) {
            this.__newName = newName;
        },

        toSql : convert("toSql"),

        fromSql : convert("fromSql"),

        getters : {
            columns : function() {
                return this.__columns;
            },

            createTableSql : function() {
                var sql = "CREATE TABLE " + this.tableName + "(";
                var columns = this.columns;
                var columnSql = [];
                for (var i in columns) {
                    columnSql.push(adapters[this.type].column(i, columns[i]));
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
                    addColumnsSql.push(adapters[this.type].addColumn(i, addColumns[i]));
                }
                if (addColumnsSql.length) {
                    sql += (needComma ? " , " : " ") + addColumnsSql.join(" ,");
                    needComma = true;
                }
                if (dropColumns.length) {
                    for (i in dropColumns) {
                        dropColumnsSql.push(adapters[this.type].dropColumn(dropColumns[i]));
                    }
                    sql += (needComma ? " , " : " ") + dropColumnsSql.join(" ,"),needComma = true;
                }
                for (i in alteredColumns) {
                    alterColumnsSql.push(adapters[this.type].alterColumn(i, alteredColumns[i]));
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


