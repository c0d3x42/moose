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
exports.DATE = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "DATE"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};

exports.TIME = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "TIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


exports.TIMESTAMP = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "TIMESTAMP", allowNull : false}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


exports.YEAR = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "YEAR"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


exports.DATETIME = function(options) {
    var ops = comb.merge({}, dateDefaults, {type : "DATETIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};