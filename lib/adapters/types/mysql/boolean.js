var Type = require("./index").Type,
 comb = require("comb");

//Boolean Types
var setBoolType = function() {
    return function(val) {
        if (!comb.isBoolean(val)) {
            if (val == "true") {
                val = true;
            } else if (val == "false") {
                val = false;
            } else {
                throw new Error("Invalid Boolean value");
            }
        }
        return val;
    };
};

var checkBooleanType = function(type) {
    return function(val) {
        if (!comb.isBoolean(val)) {
            throw new Error(type + " requires a boolean type");
        }
    };
};


var boolDefaults = {
    allowNull : true,
    primaryKey : false,
    foreignKey : false,
    "default" : null,
    description : ""
};

/**
 * Mysql BOOL datatype
 *
 * @function
 * @param {Object} options options for the BOOL data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a BOOL column.
 *
 * @name BOOL
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.BOOL = function(options) {
    var ops = comb.merge({}, boolDefaults, {type : "BOOL"}, options || {});
    ops.setSql = setBoolType();
    ops.checkType = checkBooleanType(ops.type);
    return new Type(ops);
};

/**
 * Mysql BOOLEAN datatype
 *
 * @function
 * @param {Object} options options for the BOOLEAN data type.
 * @param {Boolean} [options.allowNull=true] should the field allow null
 * @param {Boolean} [options.default = null] default value of the field
 * @param {Boolean} [options.unsigned = false] unsigned number
 * @param {Boolean} [options.description = ""] description fo the field.
 *
 * @return {Type} A Type representing a BOOLEAN column.
 *
 * @name BOOLEAN
 * @memberOf moose.adapters.mysql.types
 *
 */
exports.BOOLEAN = function(options) {
    var ops = comb.merge({}, boolDefaults, {type : "BOOLEAN"}, options || {});
    ops.setSql = setBoolType();
    ops.checkType = checkBooleanType(ops.type);
    return new Type(ops);
};
