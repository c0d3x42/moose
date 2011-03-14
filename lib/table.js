adapters = require("./adapters"),
        util = require("./util");

exports.Table = (Table = function(tableName, properties) {
    var columns = {};
    if (!tableName) throw new Error("table name required");
    this.tableName = tableName;
    this.type = properties.type || "mysql";
    delete properties.type;
    for (var i in properties) {
        columns[i] = properties[i];
        if (properties[i].isPrimaryKey()) {
            this.primaryKey = i;
        }
    }
    this.__defineGetter__("columns", function() {
        return columns;
    });
    this.__defineGetter__("table", function() {
        return adapters[this.type].createTable(this);
    });
    this.isInTable = function(columnName) {
        return (columnName in columns);
    };
});

Table.prototype.addColumn = function(name, type) {
};
Table.prototype.alterColumn = function(ops) {
};
Table.prototype.removeColumn = function(name) {
};
Table.prototype.createTable = function() {
};


Table.prototype.validate = function() {
    var args = Array.prototype.slice.call(arguments);
    var columns = this.columns;
    self = this;
    function validateValue(columnName, value) {
        if (!columnName) throw new Error("columnName required");
        if (value == "undefined") value = null;
        if (self.isInTable(columnName)) {
            return columns[columnName].check(value);
        } else {
            throw new Error(columnName + " is not in table");
        }
    }

    if (args.length > 1) {
        return validateValue(args[0], args[1]);
    } else {
        var object = args[0];
        if (!util.isObject(object)) throw new Error("object is required");
        for (var i in object) {
            validateValue(i, object[i]);
        }
        return true;
    }
};


["toSql", "fromSql"].forEach(function(op) {
    Table.prototype[op] = function() {
        var columns = this.columns;
        var args = Array.prototype.slice.call(arguments);
        if (args.length > 1) {
            var columnName = args[0], val = args[1]
            this.validate(columnName, val);
            return columns[columnName][op](val);
        } else {
            var object = args[0];
            if (op == "toSql") this.validate(object);
            var ret = {};
            for (var i in object) {
                if (i in columns) {
                    ret[i] = columns[i][op](object[i]);
                } else {
                  ret[i] = object[i];
                }
            }
            return ret;
        }

    }
});

