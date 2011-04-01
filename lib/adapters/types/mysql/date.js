var Type = require("./index").Type;

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
exports.DATE = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "DATE"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};

exports.TIME = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "TIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


exports.TIMESTAMP = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "TIMESTAMP"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


exports.YEAR = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "YEAR"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};


exports.DATETIME = function(options) {
    var ops = util.merge({}, dateDefaults, {type : "DATETIME"}, options || {});
    ops.setSql = setDateType(ops.type, checkDateType(ops.type));
    ops.checkType = checkDateType(ops.type);
    return new Type(ops);
};