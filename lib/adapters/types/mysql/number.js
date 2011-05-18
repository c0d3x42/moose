var Type = require("./index").Type,
 comb = require("comb");

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
    };
};
var checkNumberType = function(type, cmpFun) {
    return function(val) {
        if (typeof val != "number" || isNaN(val)) {
            throw new Error(type + " requires a number");
        }
        cmpFun && cmpFun(val);
    };
};


/**
 * Mysql INT datatype
 *
 * @function
 * @param {Object} options options for the INT data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Number} [options.size] max size of the number
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a INT column.
 *
 * @name INT
 * @memberOf moose.adapters.mysql.types
 *
 */
 exports.INT = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "INT"}, options || {});
    var cmpFun = function(val) {
        if (ops.unsigned) {
            if (val < 0 || val > 4294967295) throw new Error("Int out of range");
        } else {
            if (val < -2147483648 || val > 2147483647) throw new Error("Int out of range");
        }
        return true;
    };
    ops.setSql = setNumberType(checkNumberType(ops.type, cmpFun), parseInt);
    ops.checkType = checkNumberType(ops.type, cmpFun);
    return new Type(ops);
};

/**
 * @see {moose.adapters.mysql.types.INT}
 * @name NUMBER
 * @memberOf moose.adapters.mysql.types
 */
exports.NUMBER = exports.INT;


/**
 * Mysql TINYINT datatype
 *
 * @function
 * @param {Object} options options for the TINYINT data type.
 * @param {Number} [options.size] max size of the number
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a TINYINT column.
 *
 * @name TINYINT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.TINYINT = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "TINYINT"}, options || {});
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

/**
 * Mysql SMALLINT datatype
 *
 * @function
 * @param {Object} options options for the SMALLINT data type.
 * @param {Number} [options.size] max size of the number
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a SMALLINT column.
 *
 * @name SMALLINT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.SMALLINT = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "SMALLINT"}, options || {});
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


/**
 * Mysql MEDIUMINT datatype
 *
 * @function
 * @param {Object} options options for the MEDIUMINT data type.
 * @param {Number} [options.size] max size of the number
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a MEDIUMINT column.
 *
 * @name MEDIUMINT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.MEDIUMINT = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "MEDIUMINT"}, options || {});
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


/**
 * Mysql BIGINT datatype
 *
 * @function
 * @param {Object} options options for the BIGINT data type.
 * @param {Number} [options.size] max size of the number
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a BIGINT column.
 *
 * @name BIGINT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.BIGINT = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "BIGINT"}, options || {});
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

/**
 * Mysql FLOAT datatype
 *
 * @function
 * @param {Object} options options for the FLOAT data type.
 * @param {Number} [options.size] max size of the number
 * @param {Number} [options.digits] number of places right of the decimal
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a FLOAT column.
 *
 * @name FLOAT
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.FLOAT = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "FLOAT"}, options || {});
    ops.setSql = setNumberType(checkNumberType(ops.type), parseInt);
    ops.checkType = checkNumberType(ops.type);
    return new Type(ops);
};

/**
 * Mysql DOUBLE datatype
 *
 * @function
 * @param {Object} options options for the DOUBLE data type.
 * @param {Number} [options.size] max size of the number
 * @param {Number} [options.digits] number of places right of the decimal
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a DOUBLE column.
 *
 * @name DOUBLE
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.DOUBLE = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "DOUBLE"}, options || {});
    ops.setSql = setNumberType(checkNumberType(ops.type), parseInt);
    ops.checkType = checkNumberType(ops.type);
    return new Type(ops);
};


/**
 * Mysql DECIMAL datatype
 *
 * @function
 * @param {Object} options options for the DOUBLE data type.
 * @param {Number} [options.size] max size of the number
 * @param {Number} [options.digits] number of places right of the decimal
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a DOUBLE column.
 *
 * @name DECIMAL
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.DECIMAL = function(options) {
    var ops = comb.merge({}, numberDefaults, {type : "DECIMAL"}, options || {});
    ops.setSql = setNumberType(checkNumberType(ops.type), parseInt);
    ops.checkType = checkNumberType(ops.type);
    return new Type(ops);
};