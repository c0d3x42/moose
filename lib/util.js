var define = require("./utilities/define").define;

var merge = function(/*Object*/ target, /*Object*/ source) {
    var name, s, i;
    for (name in source) {
        s = source[name];
        if (!(name in target) || (target[name] !== s)) {
            target[name] = s;
        }
    }
    return target;
};

exports.merge = function(/*Object*/obj, /*Object...*/props) {
    if (!obj) {
        obj = {};
    }
    for (var i = 1, l = arguments.length; i < l; i++) {
        merge(obj, arguments[i]);
    }
    return obj; // Object
};

exports.isObject = function(obj) {
    return typeof obj == "object";
};

exports.pad = function(string, length, ch, end) {
    var strLen = string.length;
    while (strLen < length) {
        if (end) {
            string += ch;
        } else {
            string = ch + string;
        }
        strLen++;
    }
    return string;
};

exports.hitch = function(scope, method) {
    var args = Array.prototype.slice.call(arguments).slice(2);
    if (typeof method == "string") {
        method = scope[method];
    }
    if (method) {
        return function() {
            var scopeArgs = args.concat(Array.prototype.slice.call(arguments));
            return method.apply(scope, scopeArgs);
        };
    }else{
        throw new Error(method + "Method not defined");
    }
};

exports.define = define;