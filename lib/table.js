adapters = require("./adapters"),
        util = require("./util");

var convert = function(op) {
    return function() {
        var columns = this.columns;
        var args = Array.prototype.slice.call(arguments);
        if (args.length > 1) {
            var columnName = args[0], val = args[1]
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
    }
};

exports.Table = util.define(null, {
    instance : {

        tableName : null,

        type : null,

        foreignKeys : null,

        constructor : function(tableName, properties) {
            if (!tableName) throw new Error("Table name required for schema");
            this.foreignKeys = [];
            this.pk = null;
            //pull it out then define our columns then check the primary key
            var pk = properties.primaryKey;
            delete properties.primaryKey;
            this.primaryKeySql = null;
            this.tableName = tableName;
            this.__columns = columns = {};
            this.type = properties.type || "mysql";
            for (var i in properties) {
                columns[i] = properties[i];
            }
            if (pk) {
                this.primaryKey(pk);

            }
        },

        foreignKey : function(name, options) {
            this.foreignKeys.push(adapters[this.type].foreignKey(name, options));
        },

        primaryKey : function(name, options) {
            var isValid = false;

            if (name instanceof Array)
                isValid = name.every(function(n) {
                    if (this.isInTable(n)) {
                        this.columns[n].primaryKey = true;
                        return true;
                    } else {
                        return false;
                    }
                }, this);
            else {
                isValid = this.isInTable(name);
                isValid && (this.columns[name].primaryKey = true);
                this.pk = name;
            }
            if (isValid) {
                this.primaryKeySql = adapters[this.type].primaryKey(name, options);
            } else {
                throw new Error("Primary key is not in the table");
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
                if (!util.isObject(object)) throw new Error("object is required");
                for (var i in object) {
                    validateValue(i, object[i]);
                }
                return true;
            }
        },

        toSql : convert("toSql"),

        fromSql : convert("fromSql")
    },

    getters : {
        columns : function() {
            return this.__columns;
        },

        createTableSql : function() {
            var sql = "CREATE TABLE " + this.tableName + "(\n";
            var columns = this.columns;
            var columnSql = [];
            for (var i in columns) {
                columnSql.push("\t" + i + " " + columns[i].sql);
            }
            sql += columnSql.join(",\n");
            if (this.pk) sql += ", " + this.primaryKeySql
            if (this.foreignKeys.length) sql += ", " + this.foreignKeys.join(",");
            sql += ");";
            return sql;
        },

        dropTableSql : function() {
            return "DROP TABLE IF EXISTS " + this.tableName;
        }
    }
});


