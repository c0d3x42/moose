var Type = require("./index").Type;

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
exports.BOOL = function(options) {
    var ops = util.merge({}, boolDefaults, {type : "BOOL"}, options || {});
    ops.setSql = setBoolType();
    ops.checkType = checkBooleanType(ops.type);
    return new Type(ops);
};


exports.BOOLEAN = function(options) {
    var ops = util.merge({}, boolDefaults, {type : "BOOLEAN"}, options || {});
    ops.setSql = setBoolType();
    ops.checkType = checkBooleanType(ops.type);
    return new Type(ops);
};
