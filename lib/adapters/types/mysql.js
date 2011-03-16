var util = require("../../util"),
        Client = require("mysql").Client;

var stringDefaults = {
    allowNull : true,
    primaryKey : false,
    foreignKey : false,
    "default" : null,
    unique : false,
    description : ""
};

var toSqlDate = function(date, type) {
    switch (type) {
        case "DATE" :
            return date.getFullYear() + "-" + util.pad("" + (date.getMonth() + 1), 2, "0")
                    + "-" + util.pad("" + (date.getDate()), 2, "0");
            break;
        case "DATETIME" :
        case "TIMESTAMP" :
            return date.getFullYear() + "-" + util.pad((date.getMonth() + 1), 2, "0")
                    + "-" + util.pad("" + (date.getDate()), 2, "0") + " " + util.pad("" + (date.getHours()), 2, "0")
                    + ":" + util.pad("" + (date.getMinutes()), 2, "0") + ":" + util.pad("" + (date.getSeconds()), 2, "0");
            break;
        case "TIME" :
            return util.pad("" + (date.getHours()), 2, "0") + ":" + util.pad("" + (date.getMinutes()), 2, "0")
                    + ":" + util.pad("" + (date.getSeconds()), 2, "0");
            break;
        case "YEAR" :
            return "" + date.getFullYear();
            break;
    }
};

var genStringColumnDef = function(ops) {
    var numberTypes = ["TINYINT", "SMALLINT", "MEDIUMINT", "INT", "BIGINT", "FLOAT", "DOUBLE", "DECIMAL"];
    var colDef = "";
    if (ops.type) {
        colDef += ops.type;
    } else {
        throw new Error("A type is required in a column definition");
    }
    if ((ops.type != "ENUM" && ops.type != "SET") && (ops.length || ops.size)) {
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
                    }).join(","), ops.enums) + ")";
        }
    }
    if (!ops.allowNull) {
        colDef += " NOT NULL";
    }
    if (ops.primaryKey) {
        colDef += " PRIMARY KEY";
    }
    if (ops.autoIncrement) {
        colDef += " AUTO_INCREMENT";
    }
    if (ops.foreignKey) {
        var fk = ops.foreignKey;
        if (util.isObject(fk)) {
            var count = 0;
            for (var i in fk) {
                if (count < 0) break;
                colDef += " REFERENCES " + i + "(" + fk[i] + ")"
            }
        } else {
            throw new Error("foreign key must an object {table : column}")
        }
    }
    if (ops["default"]) {
        colDef += new Client().format(" DEFAULT ?", [ops["default"]]);
    }
    if (ops.unique) {
        colDef += " UNIQUE";
    }
    if (ops.unsigned && numberTypes.indexOf(ops.type) >= 0) {
        colDef += " UNSIGNED";
    }
    return colDef;
};

var Type = function(options) {
    var sql = genStringColumnDef(options);
    //This returns the column definition based off of the options
    this.__defineGetter__("sql", function() {
        return sql;
    });
    this.isPrimaryKey = function() {
        if (options.primaryKey) {
            return true;
        } else {
            false;
        }
    };
    this.fromSql = function(val) {
        var ret = (val == "null" || val == "NULL") ? null : val;
        if (ret != null) {
            ret = options.setSql(ret);
        }
        return ret;
    };
    this.toSql = function(val) {
        this.check(val);
        if (val instanceof Date) {
            val = toSqlDate(val, options.type);
        } else if (val instanceof Array) {
            val = val.join(",");
        } else if (val == null || val == undefined) {
            val = null;
        }
        return val;
    };
    this.check = function(value) {
        if ((value == null && !options.allowNull) && !(options.primaryKey && options.autoIncrement)) {
            throw new Error("value is not allowed to be null");
        } else if (value != null) {
            options.checkType(value);
        }
        return true;
    };

};

var getStringType = function(cmpFun) {
    return function(val) {
        if(!val){
            val = null;
        }else if (typeof val != "string") {
            val = "" + val;
        }
        cmpFun && cmpFun(val);
        return val;
    }
};

var checkStringType = function(type, cmpFun) {
    return function(val) {
        cmpFun && cmpFun(val);
        if (typeof val != "string") throw new Error(type + " requires a string type.");
    };
};

//String Types
var char = function(options) {
    var ops = util.merge({}, stringDefaults, {length : 255, type : "CHAR"}, options || {});
    if (ops.length > 255) {
        throw new Error("Max char type length is 255");
    }
    var cmpFun = function(val) {
        if (ops.length == undefined && val.length > 255) throw new Error("value not of length " + (ops.length || 255))
        else if (val && val.length != ops.length) throw new Error("value not of length " + (ops.length || 255))
    }
    ops.setSql = getStringType(cmpFun)
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

var varchar = function(options) {
    var ops = util.merge({}, stringDefaults, {length : 255, type : "VARCHAR"}, options || {});
    if (ops.length > 255) {
        throw new Error("Max char type length is 255 please use text");
    }
    var cmpFun = function(val) {
        if ((val.length > ops.length) || val.length > 255)
            throw new Error("value greater than valid varchar length of " + (ops.length || 255));
    }
    ops.setSql = getStringType(cmpFun)
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

var tinyText = function(options) {
    var ops = util.merge({}, stringDefaults, {length : 255, type : "TINYTEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 255) throw new Error("value greater than valid tinytext length of 255");
    }
    ops.setSql = getStringType(cmpFun)
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

var mediumText = function(options) {
    var ops = util.merge({}, stringDefaults, {length : 16777215, type : "MEDIUMTEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 16777215) throw new Error("value greater than valid tinytext length of 16777215");
    }
    ops.setSql = getStringType(cmpFun)
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

var longText = function(options) {
    var ops = util.merge({}, stringDefaults, {length : 4294967295, type : "LONGTEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 4294967295) throw new Error("value greater than valid tinytext length of 4294967295");
    }
    ops.setSql = getStringType(cmpFun)
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

var text = function(options) {
    var ops = util.merge({}, stringDefaults, {length : 65535, type : "TEXT"}, options || {});
    var cmpFun = function(val) {
        if (val.length > 65535) throw new Error("value greater than valid tinytext length of 65535");
    }
    ops.setSql = getStringType(cmpFun)
    ops.checkType = checkStringType(ops.type, cmpFun);
    return new Type(ops);
};

var checkEnumType = function(enumTypes, type) {
    var enums = util.merge([], enumTypes);
    return function(val) {
        if (typeof val != "string" || enums.indexOf(val) == -1) {
            throw new Error(type + " value must be a string and contained in the enum set");
        }
    }
};

var checkSetType = function(enumTypes, type) {
    var check = checkEnumType(enumTypes, type);
    return function(val) {
        if (typeof val == "string") {
            return check(val);
        }
        val.forEach(function(v) {return check(v)});
    }
};

var getSetType = function(cmpFunc) {
    return function(val) {
        if (typeof val == "string") {
            val = val.split(",");
        }
        cmpFunc && cmpFunc(val);
        return val;
    }
};

var enum = function(options) {
    var ops = util.merge({}, stringDefaults, {type : "ENUM", enums : []}, options || {});
    if (ops.enums && ops.enums.length > 65535) {
        throw new Error("Max number of enum values is 65535");
    }
    ops.setSql = getStringType(checkEnumType(ops.enums, ops.type));
    ops.checkType = checkEnumType(ops.enums, ops.type);
    return new Type(ops);
};

var Set = function(options) {
    var ops = util.merge({}, stringDefaults, {type : "SET", enums : []}, options || {});
    if (ops.enums && ops.enums.length > 64) {
        throw new Error("Max number of enum values is 64");
    }
    ops.setSql = getSetType(checkSetType(ops.enums, ops.type))
    ops.checkType = checkSetType(ops.enums, ops.type);
    return new Type(ops);
};

//Number Types

var numberDefaults = {
    allowNull : true,
    primaryKey : false,
    foreignKey : false,
    "default" : null,
    unique : false,
    unsigned : false,
    description : ""
};

var setNumberType = function(cmpFun, parse) {
    return function(val) {
        if (typeof val != "number") {
            val = parse(val);
        }
        cmpFun && cmpFun(val);
        return val;
    }
};
var checkNumberType = function(type, cmpFun) {
    return function(val) {
        if (typeof val != "number" || isNaN(val)) {
            throw new Error(type + " requires a number");
        }
        cmpFun && cmpFun(val);
    }
};


var int = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "INT"}, options || {});
    var cmpFun = function(val) {
        if (ops.unsigned) {
            if (val < 0 || val > 4294967295) throw new Error("Int out of range");
        } else {
            if (val < -2147483648 || val > 2147483647) throw new Error("Int out of range");
        }
    };
    ops.setSql = setNumberType(checkNumberType(ops.type, cmpFun), parseInt);
    ops.checkType = checkNumberType(ops.type, cmpFun);
    return new Type(ops);
};


var tinyInt = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "TINYINT"}, options || {});
    var cmpFun = function(val) {
        if (ops.unsigned) {
            if (val < 0 || val > 255) throw new Error("tinyint out of range");
        } else {
            if (val < -128 || val > 127) throw new Error("tinyInt out of range");
        }
    };

    ops.setSql = setNumberType(checkNumberType(ops.type, cmpFun), parseInt);
    ops.checkType = checkNumberType(ops.type, cmpFun);
    return new Type(ops);
};

var smallInt = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "SMALLINT"}, options || {});
    var cmpFun = function(val) {
        if (ops.unsigned) {
            if (val < 0 || val > 65535) throw new Error("smallint out of range");
        } else {
            if (val < -32768 || val > 32767) throw new Error("smallint out of range");
        }
    };
    ops.setSql = setNumberType(checkNumberType(ops.type, cmpFun), parseInt);
    ops.checkType = checkNumberType(ops.type, cmpFun);
    return new Type(ops);
};


var mediumInt = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "MEDIUMINT"}, options || {});
    var cmpFun = function(val) {
        if (ops.unsigned) {
            if (val < 0 || val > 16777215) throw new Error("mediumint out of range");
        } else {
            if (val < -8388608 || val > 8388607) throw new Error("mediumint out of range");
        }
    };
    ops.setSql = setNumberType(checkNumberType(ops.type, cmpFun), parseInt);
    ops.checkType = checkNumberType(ops.type, cmpFun);
    return new Type(ops);
};


var bigInt = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "BIGINT"}, options || {});
    var cmpFun = function(val) {
        if (ops.unsigned) {
            if (val < 0 || val > 18446744073709551615) throw new Error("bigint out of range");
        } else {
            if (val < -9223372036854775808 || val > 9223372036854775807) throw new Error("bigint out of range");
        }
    };
    ops.setSql = setNumberType(checkNumberType(ops.type, cmpFun), parseInt);
    ops.checkType = checkNumberType(ops.type, cmpFun);
    return new Type(ops);
};

var float = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "FLOAT"}, options || {});
    ops.setSql = setNumberType(checkNumberType(ops.type), parseInt);
    ops.checkType = checkNumberType(ops.type);
    return new Type(ops);
};


var double = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "DOUBLE"}, options || {});
    ops.setSql = setNumberType(checkNumberType(ops.type), parseInt);
    ops.checkType = checkNumberType(ops.type);
    return new Type(ops);
};


var decimal = function(options) {
    var ops = util.merge({}, numberDefaults, {type : "DECIMAL"}, options || {});
    ops.setSql = setNumberType(checkNumberType(ops.type), parseInt);
    ops.checkType = checkNumberType(ops.type);
    return new Type(ops);
};


//Date

var dateDefaults = {
    allowNull : true,
    primaryKey : false,
    foreignKey : false,
    "default" : null,
    unique : false,
    description : ""
};


var setDateType = function(type, cmpFun) {
    return function(val) {
        if (!(val instanceof Date)) {
            if (type == "TIME") {
                if (!val.match(/^\d{2}:\d{2}:\d{2}$/)) throw new Error("TIME must be formatted as HH:MM:SS");
                var vals = val.split(":");
                val = new Date();
                val.setHours.apply(val, vals);
            } else {
                if (type == "DATE" && !val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    throw new Error("DATE must be formated as YYYY-MM-DD");
                } else if ((type == "DATETIME" || type == 'TIMESTAMP') && !val.match(/^\d{4}-\d{2}-\d{2}\s{1}\d{2}:\d{2}:\d{2}$/)) {
                    throw new Error(type + " must be formated as YYYY-MM-DD HH:MM:SS");
                } else if (type == "YEAR" && !val.match(/^\d{4}$/)) {
                    throw new Error("YEAR must be formated as YYYY");
                }
                val = new Date(Date.parse(val));
            }
        }
        cmpFun && cmpFun(val);
        return val;
    }
};

var checkDateType = function(type) {
    return function(val) {
        if (!(val instanceof Date)) {
            throw new Error(type + " requires a date type");
        }
    }
}
var date = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "DATE"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};

var time = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "TIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


var timestamp = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "TIMESTAMP"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


var year = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "YEAR"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


var dateTime = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "DATETIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


//Boolean Types
var setBoolType = function() {
    return function(val) {
        if (typeof val != "boolean") {
            if (val == "true") {
                val = true;
            } else if (val == "false") {
                val = false;
            } else {
                throw new Error("Invalid Boolean value")
            }
        }
        return val;
    }
};

var checkBooleanType = function(type) {
    return function(val) {
        if (typeof val != "boolean") {
            throw new Error(type + " requires a boolean type");
        }
    }
}


var boolDefaults = {
    allowNull : true,
    primaryKey : false,
    foreignKey : false,
    "default" : null,
    description : ""
};

var bool = function(options) {
    var ops = util.merge({}, boolDefaults, {type : "BOOL"}, options || {});
    ops.setSql = setBoolType();
    ops.checkType = checkBooleanType(ops.type);
    return new Type(ops);
};


var Boolean = function(options) {
    var ops = util.merge({}, boolDefaults, {type : "BOOLEAN"}, options || {});
    ops.setSql = setBoolType();
    ops.checkType = checkBooleanType(ops.type);
    return new Type(ops);
};

exports.types = {
    //String Types
    CHAR :          char,
    VARCHAR :       varchar,
    STRING :        varchar,
    TINYTEXT :      tinyText,
    MEDIUMTEXT :    mediumText,
    LONGTEXT :      longText,
    ENUM :          enum,
    SET :           Set,
    //Number Types
    INT :           int,
    NUMBER :           int,
    TINYINT :       tinyInt,
    SMALLINT :      smallInt,
    MEDIUMINT :     mediumInt,
    BIGINT :        bigInt,
    FLOAT :         float,
    DOUBLE :        double,
    DECIMAL :       decimal,

    //Date Types
    DATE :          date,
    TIME :          time,
    TIMESTAMP :     timestamp,
    YEAR :          year,
    DATETIME :      dateTime,

    //Boolean Types
    BOOL :          bool,
    BOOLEAN :       Boolean
};

