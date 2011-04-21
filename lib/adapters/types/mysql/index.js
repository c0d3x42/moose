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


exports.Type = comb.define(null, {
    instance : {
        constructor : function(options) {
            this.__options = options;
        },

        //sets value
        set : function(name, value) {
            this.__options[name] = value;
        },

        //This returns the column definition based off of the options

        isPrimaryKey : function() {
            if (this.__options.primaryKey) {
                return true;
            } else {
                false;
            }
        },

        fromSql : function(val) {
            var ret = (val == "null" || val == "NULL") ? null : val;
            if (ret != null) {
                ret = this.__options.setSql(ret);
            }
            return ret;
        },

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


/*
 * Creates foreign key syntax
 *
 * example
 * foreignKey("myColumn", {otherTable : "otherTableColumn"}
 *   - FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn)
 * foreignKey([myColumn, myColumn2], {otherTable : ["otherTableColumn", "otherTableColumn2"]});
 *   - FOREIGN KEY (myColumn, myColumn2) REFERENCES otherTable (otherTableColumn, otherTableColumn2)
 *
 * foreignKey({myColumn : {otherTable : "otherTableColumn"}, myColumn2 : {otherTable2 : "otherTableColumn2"}});
 *   - FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn),
 *     FOREIGN KEY (myColumn2) REFERENCES otherTable2 (otherTableColumn2)
 **/

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

/*
 * Creates alter table foreign key syntax
 *
 * example
 * addForeignKey("myColumn", {otherTable : "otherTableColumn"}
 *   - ADD FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn)
 * addForeignKey([myColumn, myColumn2], {otherTable : ["otherTableColumn", "otherTableColumn2"]});
 *   - ADD CONSTRAINT fk_myColumnMyColumn2... FOREIGN KEY (myColumn, myColumn2) REFERENCES otherTable (otherTableColumn, otherTableColumn2)
 *
 * addForeignKey({myColumn : {otherTable : "otherTableColumn"}, myColumn2 : {otherTable2 : "otherTableColumn2"}});
 *   - ADD FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn),
 *     ADD FOREIGN KEY (myColumn2) REFERENCES otherTable2 (otherTableColumn2)
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

/*
 * Creates drop foreign key syntax
 *
 * example
 * dropForeignKey("myColumn", {otherTable : "otherTableColumn"}
 *   - DROP FOREIGN KEY myColumn
 * foreignKey([myColumn, myColumn2], {otherTable : ["otherTableColumn", "otherTableColumn2"]});
 *   - DROP FOREIGN KEY fk_myColumnMyColumn2...
 *
 * foreignKey({myColumn : {otherTable : "otherTableColumn"}, myColumn2 : {otherTable2 : "otherTableColumn2"}});
 *   - DROP FOREIGN KEY myColumn,
 *     DROP FOREIGN KEY myColumn2
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

/*
 * Creates primary key syntax
 *
 * example
 * primaryKey("myColumn"}
 *   - PRIMARY KEY (myColumn)
 * primaryKey([myColumn, myColumn2, ...]);
 *   - PRIMARY KEY (myColumn, myColumn2, ...)
 *
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

/*
 * Creates alter table primary key syntax
 *
 * example
 * addPrimaryKey("myColumn"}
 *   - ADD PRIMARY KEY (myColumn)
 * addPrimaryKey([myColumn, myColumn2, ...]);
 *   - ADD CONSTRAINT pk_myColumnMyColumn2... PRIMARY KEY (myColumn, myColumn2, ...)
 *
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

/*
 * Creates drop primary key syntax
 *
 * example
 * dropPrimaryKey()
 *   - DROP PRIMARY KEY
 *
 **/
exports.dropPrimaryKey = function(name) {
    return "DROP PRIMARY KEY";
};

/*
 * Creates unique syntax
 *
 * example
 * unique("myColumn"}
 *   - UNIQUE (myColumn)
 * foreignKey([myColumn, myColumn2, ...]);
 *   - CONSTRAINT uc_myColumnMyColumn2... UNIQUE (myColumn, myColumn2, ...)
 *
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

/*
 * Creates unique syntax
 *
 * example
 * addUnique("myColumn"}
 *   - ADD UNIQUE (myColumn)
 * foreignKey([myColumn, myColumn2, ...]);
 *   - ADD CONSTRAINT uc_myColumnMyColumn2... UNIQUE (myColumn, myColumn2, ...)
 *
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

/*
 * Creates drop unique syntax
 *
 * example
 * addUnique("myColumn"}
 *   - DROP INDEX myColumn
 * foreignKey([myColumn, myColumn2, ...]);
 *   - DROP INDEX uc_myColumnMyColumn2
 *
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

exports.column = function(name, type) {
    var sql = "";
    if (!name) throw new Error("when calling alterColumn columnName is required.");
    return name + " " + type.sql;
};

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

exports.addColumn = function(name, type) {
    var sql = "";
    if (!name) throw new Error("when calling alterColumn columnName is required.");
    return "ADD COLUMN " + name + " " + type.sql;
};

exports.dropColumn = function(name) {
    return "DROP COLUMN " + name;
};

exports.types = comb.merge({}, require("./string"), require("./number"), require("./boolean"), require("./date"));
exports.isValidType = function(o) {
    return o instanceof exports.Type;
};

exports.fromColDef = fromColumnDef;

