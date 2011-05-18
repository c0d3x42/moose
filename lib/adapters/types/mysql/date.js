var Type = require("./index").Type,
        comb = require("comb");

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
        if (!comb.isDate(val)) {
            var patt = "yyyy";
            if (type == "TIME") {
                patt = "h:m:s";
            } else if (type == "DATE") {
                patt += "-MM-dd";
            } else if ((type == "DATETIME" || type == 'TIMESTAMP')) {
                patt += "-MM-dd h:m:s";
            }
            val = comb.date.parse(val, patt);
            if (!val) {
                throw new Error("DATE must be formatted as " + patt);
            }
        }
        cmpFun && cmpFun(val);
        return val;
    };
};

var checkDateType = function(type) {
    return function(val) {
        if (!(val instanceof Date)) {
            throw new Error(type + " requires a date type");
        }
    };
};

/**
 * Mysql DATE datatype
 *
 * @function
 * @param {Object} options options for the DATE data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a DATE column.
 *
 * @name DATE
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.DATE = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "DATE"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};

/**
 * Mysql TIME datatype
 *
 * @function
 * @param {Object} options options for the TIME data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a TIME column.
 *
 * @name TIME
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.TIME = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "TIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


/**
 * Mysql TIMESTAMP datatype
 *
 * @function
 * @param {Object} options options for the TIMESTAMP data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a TIMESTAMP column.
 *
 * @name TIMESTAMP
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.TIMESTAMP = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "TIMESTAMP", allowNull : false}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


/**
 * Mysql YEAR datatype
 *
 * @function
 * @param {Object} options options for the YEAR data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a YEAR column.
 *
 * @name YEAR
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.YEAR = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "YEAR"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


/**
 * Mysql DATETIME datatype
 *
 * @function
 * @param {Object} options options for the DATETIME data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a DATETIME column.
 *
 * @name DATETIME
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.DATETIME = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "DATETIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};