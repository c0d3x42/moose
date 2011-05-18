var comb = require("comb"),
        Client = require("mysql").Client;

var toSqlDate = function(date, type) {
    var pad = comb.string.pad, ret, format = comb.date.format;
    switch (type) {
        case "DATE" :
            ret = format(date, "yyyy-MM-dd");
            break;
        case "DATETIME" :
        case "TIMESTAMP" :
            ret = format(date, "yyyy-MM-dd h:m:s");
            break;
        case "TIME" :
            ret = format(date, "h:m:s");

            break;
        case "YEAR" :
            ret = format(date, "yyyy");
            break;
    }
    return ret;
};

var genStringColumnDef = function(ops) {
    var numberTypes = ["TINYINT", "SMALLINT", "MEDIUMINT", "INT", "BIGINT", "FLOAT", "DOUBLE", "DECIMAL"];
    var colDef = "";
    if (ops.type) {
        colDef += ops.type.toUpperCase();
    } else {
        throw new Error("A type is required in a column definition");
    }
    if ((ops.type != "ENUM" && ops.type != "SET") && (ops.length != undefined || ops.size != undefined)) {
        colDef += "(" + (numberTypes.indexOf(ops.type) < 0 ? ops.length : ops.size);
        if (["FLOAT", "DOUBLE", "DECIMAL"].indexOf(ops.type) >= 0 && ops.digits) {
            colDef += "," + ops.digits;
        }
        colDef += ")";
    } else if (ops.type == "ENUM" || ops.type == "SET") {
        if (!ops.enums || !(ops.enums instanceof Array)) {
            throw new Error("and array of enum values required when using an enum type");
        } else {
            colDef += "(" + new Client().format(ops.enums.map(
                    function() {
                        return "?";
                    }).join(","), ops.enums.slice()) + ")";
        }
    }
    if (typeof ops.unsigned == "boolean" && numberTypes.indexOf(ops.type) >= 0) {
        colDef += ops.unsigned ? " UNSIGNED" : " SIGNED";
    }
    if (typeof ops.allowNull == "boolean") {
        colDef += ops.allowNull ? " NULL" : " NOT NULL";
    }
    if (ops.autoIncrement) {
        colDef += " AUTO_INCREMENT";
    }
    if (ops["default"] != undefined) {
        colDef += new Client().format(" DEFAULT ?", [ops["default"]]);
    }
    if (ops.unique) {
        colDef += " UNIQUE";
    }
    return colDef;
};
/* { Field: 'id',
 Type: 'int(11)',
 Null: 'NO',
 Key: 'PRI',
 Default: null,
 Extra: 'auto_increment' }*/
var fromColumnDef = function(o) {
    var numberTypes = ["TINYINT", "SMALLINT", "MEDIUMINT", "INT", "BIGINT", "FLOAT", "DOUBLE", "DECIMAL"];
    var params = {};
    var colDef = "";

    var type = o.Type;
    var parts = type.split(/\(|,|\)/);
    if (parts.length > 1) {
        //remove the blank value at the end
        var i;
        if ((i = parts.indexOf("")) > 1) {
            parts.splice(i, 1);
        }
        //then we know it has a size, length and or digits
        type = parts.shift().toUpperCase();
        if (numberTypes.indexOf(type) >= 0) {
            params.size = parseInt(parts.shift());
            var digits = parts.shift();
            if (digits) {
                if (["FLOAT", "DOUBLE", "DECIMAL"].indexOf(type) >= 0 && !isNaN(parseInt(digits))) {
                    params.digits = parseInt(digits);
                    digits = parts.shift();
                    //grab signed prop
                    if (digits && (digits === "signed" || digits === "unsigned")) {
                        params.unsigned = (digits == "unsigned");
                    }
                } else if (digits === " signed" || digits === " unsigned") {
                    params.unsigned = (digits == " unsigned");
                }
            }
        } else {
            if (parts.length && type == "ENUM" || type == "SET") {
                //assign the enums
                parts = parts.map(function(p) {
                    return p.replace(/\\|'/g, "");
                });
                params.enums = parts;
            } else if (parts.length) {
                params.length = parseInt(parts[0]);
            }
        }
    } else {
        type = type.toUpperCase();
    }
    if (o.Null) {
        params.allowNull = o.Null === "YES";
    }
    if (o.Key) {
        if (o.Key == "PRI") {
            params.primaryKey = true;
        }
    }
    if (o.Extra) {
        var extras = o.Extra.split(" ");
        params.autoIncrement = extras.indexOf("auto_increment") >= 0;

    }
    if (o["Default"]) {
        params["default"] = o["Default"];
    }
    return exports.types[type](params);
};

/**
 * @class
 * Represents a mysql datatype. This Class should not be instantiated directly!
 *
 *
 * @property {String} sql the column definition of this Type.
 *
 * @name Type
 */
exports.Type = comb.define(null, {
    instance : {
        /**@lends Type.prototype*/

        constructor : function(options) {
            this.__options = options;
        },

        /**
         * Set a property on this Type, such as isNull, unique, default etc...
         *
         * @param {String} name the name of the property.
         * @param {*} value the value to set it to.
         */
        set : function(name, value) {
            this.__options[name] = value;
        },


        /**
         * Is this Type a primary key.
         *
         * @return {Boolean} true if this Type is a primary key.
         */
        isPrimaryKey : function() {
            if (this.__options.primaryKey) {
                return true;
            } else {
                false;
            }
        },

        /**
         * Convert an SQL value to the javascript equivalent. This method will do a type check after the conversionn.
         *
         * @param {String} val the sql string to convert.
         *
         * @return {*} the javascript value.
         */
        fromSql : function(val) {
            var ret = (val == "null" || val == "NULL") ? null : val;
            if (ret != null) {
                ret = this.__options.setSql(ret);
            }
            return ret;
        },

        /**
         * Converts a javacript value to the corresponding sql equivalent.
         * This function does a type check on the value before conversion, if it is not the right type an error is thrown.
         * @param {*} val the javacript value to convert
         *
         * @return {String} the sql value.
         */
        toSql : function(val) {
            this.check(val);
            if (val instanceof Date) {
                val = toSqlDate(val, this.__options.type);
            } else if (val instanceof Array) {
                val = val.join(",");
            } else if (val == null || val == undefined) {
                val = null;
            }
            return val;
        },

        /**
         * Checks a value against this Type column definition.
         *
         * @param {*} value the value to check.
         *
         * @return {Boolean} true if the value is valid.
         */
        check : function(value) {
            if ((value == null && !this.__options.allowNull) && !(this.primaryKey && this.__options.autoIncrement)) {
                throw new Error("value is not allowed to be null");
            } else if (value != null) {
                this.__options.checkType(value);
            }
            return true;
        },

        getters : {
            sql : function() {
                return genStringColumnDef(this.__options);
            }
        }

    }
});


/**
 * @function
 * Creates foreign key syntax
 *
 * @example
 *
 * //FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn)
 * moose.adapters.mysql.foreignKey("myColumn", {otherTable : "otherTableColumn"});
 *
 * //FOREIGN KEY (myColumn, myColumn2)
 * //     REFERENCES otherTable (otherTableColumn, otherTableColumn2)
 * moose.adapters.mysql.foreignKey([myColumn, myColumn2], {
 *              otherTable : ["otherTableColumn", "otherTableColumn2"]
 * });
 *
 * //FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn),
 * //FOREIGN KEY (myColumn2) REFERENCES otherTable2 (otherTableColumn2)
 * moose.adapters.mysql.foreignKey({
 *              myColumn : {otherTable : "otherTableColumn"},
 *              myColumn2 : {otherTable2 : "otherTableColumn2"}
 * });
 *
 * @param {String|Array|Object} name
 * <ul>
 *     <li>If a String is provided then it is assumed to be the name of the column</li>
 *     <li>If an array is provided then it assumed to be an array of columns that reference the columns specified in the foreign table.</li>
 *     <li>If an object is specified then its treated as multiple foreign keys against multiple tables.</li>
 * </ul>
 * @param {Object} options object containg the foreignTable as the key and the value should be either a string or array,
 *                 depending on the name parameter, see the example.
 *
 * @return {String} the sql
 *
 * @name foreignKey
 * @memberOf moose.adapters.mysql
 */

exports.foreignKey = function(name, options) {
    var sql, i;
    if (name instanceof Array) {
        if (typeof options != "object") throw new Error("when calling foreign key options must be an object");
        var fkName = createContraintName("fk", name);
        sql = "CONSTRAINT " + fkName + " FOREIGN KEY (" + name.join(",") + ")";
        var otherTable, columns = null;
        for (i in options) {
            otherTable = i;
            columns = options[i];
        }
        if (columns.length == name.length) {
            sql += " REFERENCES " + otherTable + " (" + columns.join(",") + ")";
        } else {
            throw new Error("parent table columns must be the same length as the table columns");
        }
    } else if (typeof name == "object") {
        var fKeys = [];
        for (i in name) {
            fKeys.push(exports.foreignKey(i, name[i]));
        }
        sql = fKeys.join(",");
    } else if (typeof name == "string") {
        if (typeof options != "object") throw new Error("when calling foreign key options must be an object");
        sql = "FOREIGN KEY (" + name + ")",count = 0;
        for (i in options) {
            if (count != 0) throw new Error("when calling foreing key with a string for the column name, you options must be a one deep object");
            if (typeof options[i] == "string") {
                sql += " REFERENCES " + i + " (" + options[i] + ")";
            } else {
                throw new Error("parents column name must be a string when calling foreign key with a string for column name");
            }
        }
    } else {
        throw new Error("When calling foreign key you must pass an array, object, or string as columnName");
    }
    return sql;
};

/**
 * @function
 * Creates alter table foreign key syntax
 *
 * @example
 *
 * //ADD FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn)
 * moose.adapters.mysql.addForeignKey("myColumn", {otherTable : "otherTableColumn"}
 *
 * //ADD CONSTRAINT fk_myColumnMyColumn2... FOREIGN KEY (myColumn, myColumn2)
 * //             REFERENCES otherTable (otherTableColumn, otherTableColumn2)
 * moose.adapters.mysql.addForeignKey([myColumn, myColumn2], {
 *                  otherTable : ["otherTableColumn", "otherTableColumn2"]
 * });
 *
 * //ADD FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn),
 * //ADD FOREIGN KEY (myColumn2) REFERENCES otherTable2 (otherTableColumn2)
 * moose.adapters.mysql.addForeignKey({
 *                  myColumn : {otherTable : "otherTableColumn"},
 *                  myColumn2 : {otherTable2 : "otherTableColumn2"}
 *});
 *
 *
 * @param {String|Array|Object} name
 * <ul>
 *     <li>If a String is provided then it is assumed to be the name of the column</li>
 *     <li>If an array is provided then it assumed to be an array of columns that reference the columns specified in the foreign table.</li>
 *     <li>If an object is specified then its treated as multiple foreign keys against multiple tables.</li>
 * </ul>
 * @param {Object} options object containg the foreignTable as the key and the value should be either a string or array,
 *                 depending on the name parameter, see the example.
 * @return {String} the sql
 *
 * @name addForeignKey
 * @memberOf moose.adapters.mysql
 **/

exports.addForeignKey = function(name, options) {
    var sql, i;
    if (name instanceof Array) {
        if (typeof options != "object") throw new Error("when calling foreign key options must be an object");
        var fkName = createContraintName("fk", name);
        sql = "ADD CONSTRAINT " + fkName + " FOREIGN KEY (" + name.join(",") + ")";
        var otherTable, columns = null;
        for (i in options) {
            otherTable = i;
            columns = options[i];
        }
        if (columns.length == name.length) {
            sql += " REFERENCES " + otherTable + " (" + columns.join(",") + ")";
        } else {
            throw new Error("parent table columns must be the same length as the table columns");
        }
    } else if (typeof name == "object") {
        var fKeys = [];
        for (i in name) {
            fKeys.push(exports.addForeignKey(i, name[i]));
        }
        sql = fKeys.join(",");
    } else if (typeof name == "string") {
        if (typeof options != "object") throw new Error("when calling foreign key options must be an object");
        sql = "ADD FOREIGN KEY (" + name + ")",count = 0;
        for (i in options) {
            if (count != 0) throw new Error("when calling foreing key with a string for the column name, you options must be a one deep object");
            if (typeof options[i] == "string") {
                sql += " REFERENCES " + i + " (" + options[i] + ")";
            } else {
                throw new Error("parents column name must be a string when calling foreign key with a string for column name");
            }
        }
    } else {
        throw new Error("When calling addForeign key you must pass an array, object, or string as columnName");
    }
    return sql;
};


/**
 * @function
 * Creates drop foreign key syntax
 *
 * @example
 *
 * //DROP FOREIGN KEY myColumn
 * moose.adapters.mysql.dropForeignKey("myColumn", {otherTable : "otherTableColumn"}
 *
 * //DROP FOREIGN KEY fk_myColumnMyColumn2
 * moose.adapters.mysql.foreignKey([myColumn, myColumn2], {
 *              otherTable : ["otherTableColumn", "otherTableColumn2"]
 * });
 *
 * //DROP FOREIGN KEY myColumn,
 * //DROP FOREIGN KEY myColumn2
 * moose.adapters.mysql.foreignKey({
 *              myColumn : {otherTable : "otherTableColumn"},
 *              myColumn2 : {otherTable2 : "otherTableColumn2"}
 * });
 *
 *
 * @param {String|Array|Object} name
 * <ul>
 *     <li>If a String is provided then it is assumed to be the name of the column</li>
 *     <li>If an array is provided then it assumed to be an array of columns that reference the columns specified in the foreign table.</li>
 *     <li>If an object is specified then its treated as multiple foreign keys against multiple tables.</li>
 * </ul>
 * @param {Object} options object containg the foreignTable as the key and the value should be either a string or array,
 *                 depending on the name parameter, see the example.
 * @return {String} the sql
 *
 * @name dropForeignKey
 * @memberOf moose.adapters.mysql
 **/
exports.dropForeignKey = function(name, options) {
    var sql;
    if (name instanceof Array) {
        if (typeof options != "object") throw new Error("when calling foreign key options must be an object");
        var fkName = createContraintName("fk", name);
        sql = "DROP FOREIGN KEY " + fkName;
    } else if (typeof name == "object") {
        var fKeys = [];
        for (var i in name) {
            fKeys.push(exports.dropForeignKey(i, name[i]));
        }
        sql = fKeys.join(",");
    } else if (typeof name == "string") {
        if (typeof options != "object") throw new Error("when calling foreign key options must be an object");
        sql = "DROP FOREIGN KEY " + name;
    } else {
        throw new Error("When calling dropForeign key you must pass an array, object, or string as columnName");
    }
    return sql;
};

var createContraintName = function(prefix, names, postFix) {
    postFix = postFix || "",prefix = prefix || "";
    var ret = names.map(
            function(p, i) {
                if (i) {
                    return p.charAt(0).toUpperCase() + p.substr(1);
                } else {
                    return p;
                }
            }).join("");
    prefix && (ret = prefix + "_" + ret);
    postFix && (ret += "_" + postFix);
    return ret;
};


/**
 * @function
 * Creates primary key syntax
 *
 * @example
 *
 * //PRIMARY KEY (myColumn)
 * moose.adapters.mysql.primaryKey("myColumn"}
 *
 * //PRIMARY KEY (myColumn, myColumn2, ...)
 * moose.adapters.mysql.primaryKey([myColumn, myColumn2, ...]);
 *
 * @param {String|Array} name name or names of columns to create a primary key.
 *
 * @return {String} the sql
 *
 * @name primaryKey
 * @memberOf moose.adapters.mysql
 **/
exports.primaryKey = function(name) {
    var sql;
    if (name instanceof Array) {
        var pkName = createContraintName("pk", name);
        sql = "CONSTRAINT " + pkName + " PRIMARY KEY (" + name.join(",") + ")";
    } else if (typeof name == "string") {
        sql = "PRIMARY KEY (" + name + ")";
    } else {
        throw new Error("When calling primaryKey the key must be a string or array");
    }
    return sql;
};

/**
 * @function
 * Creates add primary key syntax
 *
 * @example
 *
 * //ADD PRIMARY KEY (myColumn)
 * moose.adapters.mysql.addPrimaryKey("myColumn"}
 *
 * //ADD CONSTRAINT pk_myColumnMyColumn2... PRIMARY KEY (myColumn, myColumn2, ...)
 * moose.adapters.mysql.addPrimaryKey([myColumn, myColumn2, ...]);
 *
 * @param {String|Array} name name or names of columns to create a primary key.
 *
 * @return {String} the sql
 *
 * @name addPrimaryKey
 * @memberOf moose.adapters.mysql
 **/
exports.addPrimaryKey = function(name) {
    var sql;
    if (name instanceof Array) {
        var pkName = createContraintName("pk", name);
        sql = "ADD CONSTRAINT " + pkName + " PRIMARY KEY (" + name.join(",") + ")";
    } else if (typeof name == "string") {
        sql = "ADD PRIMARY KEY (" + name + ")";
    } else {
        throw new Error("When calling addPrimaryKey the key must be a string or array");
    }
    return sql;
};

/**
 * @function
 * Creates drop primary key syntax
 *
 * @example
 *  //DROP PRIMARY KEY
 * dropPrimaryKey()
 *
 * @return {String} the sql
 *
 * @name dropPrimaryKey
 * @memberOf moose.adapters.mysql
 **/
exports.dropPrimaryKey = function(name) {
    return "DROP PRIMARY KEY";
};

/**
 * @function
 * Creates unique syntax
 *
 * @example
 * //UNIQUE (myColumn)
 * moose.adapters.mysql.unique("myColumn"}
 *
 * //CONSTRAINT uc_myColumnMyColumn2... UNIQUE (myColumn, myColumn2, ...)
 * moose.adapters.mysql.unique([myColumn, myColumn2, ...]);
 *
 * @param {String|Array} name name or names of columns to create a unique constraint.
 *
 * @return {String} the sql
 *
 * @name unique
 * @memberOf moose.adapters.mysql
 **/
exports.unique = function(name) {
    var sql;
    if (name instanceof Array) {
        var ucName = createContraintName("uc", name);
        sql = "CONSTRAINT " + ucName + " UNIQUE (" + name.join(",") + ")";
    } else if (typeof name == "string") {
        sql = "UNIQUE (" + name + ")";
    } else {
        throw new Error("When calling unique the key must be a string or array");
    }
    return sql;
};

/**
 * @function
 * Creates add unique syntax
 *
 * @example
 *
 * //ADD UNIQUE (myColumn)
 * moose.adapters.mysql.addUnique("myColumn"}
 *
 * //ADD CONSTRAINT uc_myColumnMyColumn2... UNIQUE (myColumn, myColumn2, ...)
 * moose.adapters.mysql.addUnique([myColumn, myColumn2, ...]);
 *
 * @param {String|Array} name name or names of columns to create a unique constraint.
 *
 * @return {String} the sql
 *
 * @name addUnique
 * @memberOf moose.adapters.mysql
 **/
exports.addUnique = function(name) {
    var sql;
    if (name instanceof Array) {
        var ucName = createContraintName("uc", name);
        sql = "ADD CONSTRAINT " + ucName + " UNIQUE (" + name.join(",") + ")";
        + ")";
    } else if (typeof name == "string") {
        sql = "ADD UNIQUE (" + name + ")";
    } else {
        throw new Error("When calling addUnique the key must be a string or array");
    }
    return sql;
};

/**
 * @function
 * Creates drop unique syntax
 *
 *
 * @example
 *
 * //DROP INDEX myColumn
 * moose.adapters.mysql.dropUnique("myColumn")
 *
 * //DROP INDEX uc_myColumnMyColumn2
 * moose.adapters.mysql.dropUnique([myColumn, myColumn2, ...]);
 *
 * @param {String|Array} name name or names of columns to create a unique constraint.
 *
 * @return {String} the sql
 *
 * @name dropUnique
 * @memberOf moose.adapters.mysql
 **/
exports.dropUnique = function(name) {
    var sql;
    if (name instanceof Array) {
        var ucName = createContraintName("uc", name);
        sql = "DROP INDEX " + ucName;
        + ")";
    } else if (typeof name == "string") {
        sql = "DROP INDEX " + name;
    } else {
        throw new Error("When calling dropUnique the key must be a string or array");
    }
    return sql;
};

/**
 * Create the column definition of a type
 *
 * @function
 *
 * @param {String} name the name of the column
 * @param {Type} type the Type object of the column
 *
 * @return {String} the sql
 *
 * @name column
 * @memberOf moose.adapters.mysql
 */
exports.column = function(name, type) {
    var sql = "";
    if (!name) throw new Error("when calling alterColumn columnName is required.");
    return name + " " + type.sql;
};

/**
 * Creates the alter column syntax.
 *
 * @function
 *
 * @param {String} name the name of the column
 * @param {Object} options parameters representing how to transform the column
 * @param {Type} [options.type] the Type object of the column.
 * @param {String} [options.newName] the new name of the column.
 * @param {Type} [options.original] the original type of the column
 * @prams {Boolean} [options.allowNull] the change the column to allow null
 * @param {*} [options.default] change the default value of the column.
 *
 * @return {String} the sql
 *
 * @name alterColumn
 * @memberOf moose.adapters.mysql
 */
exports.alterColumn = function(name, options) {
    var sql = "";
    if (!name) throw new Error("when calling alterColumn columnName is required.");
    if (options.type) {
        if (options.newName) {
            sql += "CHANGE COLUMN " + name + " " + options.newName;
        } else {
            sql += "MODIFY COLUMN " + name;
        }
        //the type is being changed
        sql += " " + options.type.sql;
    } else {
        var original = options.original;
        if (original) {
            if (options.newName) {
                sql += "CHANGE COLUMN " + name + " " + options.newName;
            } else {
                sql += "MODIFY COLUMN " + name;
            }
            if (options.allowNull != undefined) {
                original.set("allowNull", options.allowNull);
            }
            if (options["default"] != undefined) {
                original.set("default", options["default"]);
            }
            sql += " " + original.sql;
        }

    }
    return sql;
};

/**
 * Create add column syntax.
 *
 * @function
 *
 * @param {String} name name of the column
 * @param {Type} type the Type object representing the column
 *
 * @return {String} the sql
 *
 * @name addColumn
 * @memberOf moose.adapters.mysql
 *
 */
exports.addColumn = function(name, type) {
    var sql = "";
    if (!name) throw new Error("when calling alterColumn columnName is required.");
    return "ADD COLUMN " + name + " " + type.sql;
};

/**
 * Create drop column syntax.
 *
 * @function
 *
 * @param {String} name name of the column being dropped.
 *
 *@return {String} the sql
 *
 * @name dropColumn
 * @memberOf moose.adapters.mysql
 */
exports.dropColumn = function(name) {
    return "DROP COLUMN " + name;
};

/**
 * @name types
 * @memberOf moose.adapters.mysql
 * @namespace
 */
exports.types = comb.merge({}, require("./string"), require("./number"), require("./boolean"), require("./date"));
exports.isValidType = function(o) {
    return o instanceof exports.Type;
};


/**
 * Creates a {@link Type} from a column defintion
 *
 * @function
 * @param {Object} sql the sql type definition returned from a table query.
 *
 * @return {Type} The Type
 *
 * @name fromColDef
 * @memberOf moose.adapters.mysql
 */
exports.fromColDef = fromColumnDef;

