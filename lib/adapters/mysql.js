Client = require("mysql").Client,
        promise = require("../promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        utility = require("../util"),
        hitch = utility.hitch,
        mysqlTypes = require("./types/mysql"),
        Table = require("../table").Table;

/*
 MYSQL query adapter to convert a query into mysql syntax;
 * */

var conditionedJoinTypes = {
    innerJoin : "inner join",
    fullOuterJoin : "full outer join",
    rightOuterJoin : "right outer join",
    leftOuterJoin : "left outer join",
    fullJoin : "full join",
    rightJoin : "right join",
    leftJoin : "left join"
};

/* These symbols have _join methods created (e.g. natural_join) that
 call join_table with the symbol.  They only accept a single table
 argument which is passed to join_table, and they raise an error
 if called with a block. */
var unConditionedJoinTypes = {
    naturalJoin : "natural join",
    naturalLeftJoin : "natural left join",
    naturalRightJoin : "natural right join",
    naturalFullJoin : "natural full join",
    crossJoin : "cross join"
};

// All methods that return modified datasets with a joined table added.
var joinMethods = {};
for (var i in conditionedJoinTypes) {
    joinMethods[i] = conditionedJoinTypes[i];
}
for (i in unConditionedJoinTypes) {
    joinMethods[i] = unConditionedJoinTypes[i];
}

var inOperator = {
    "in" : "in",
    notIn : "not in"
};

var betweenOperator = {
    between : "between",
    notBetween : "not between"
};

var booleanOperator = {
    gt : ">",
    gte : ">=",
    lt : "<",
    lte : "<=",
    eq : "=",
    neq : "!="
};

var logicalOperator = {
    and : "and",
    or : "or"
};

var isOperator = {
    is : "is",
    isNot : "is not",
    isNull : "is null",
    isNotNull : "is not null"
};


var aggregateOperator = {
    count : "count",
    sum : "sum",
    avg : "avg",
    min : "min",
    max : "max",
    bitAnd : "bit_and",
    bitOr : "bit_or",
    bitXor : "bit_xor",
    std : "std",
    stdDevPop : "stddev_pop",
    stdDevSamp : "stddev_samp",
    stdDev : "stddev",
    varPop : "var_pop",
    varSamp : "var_samp",
    variance : "variance"
};

var likeOperator = {
    like : "like",
    notLike : "not like"
};

var transformBooleanOperator = function(val) {
    if (typeof val == "boolean") {
        val = val.toString();
    } else if (val == "unknown") {
    } else if (val == null) {
        val = "null";
    } else {
        throw new Error(val + " is not a boolean type");
    }
    return val;
};

var escape = function(val, includeTicks) {
    if (val === undefined || val === null) {
        return 'NULL';
    }
    switch (typeof val) {
        case 'boolean': return (val) ? 'true' : 'false';
        case 'number': return val + '';
    }

    if (typeof val === 'object') {
        val = val.toString();
    }

    val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, function(s) {
        switch (s) {
            case "\0": return "\\0";
            case "\n": return "\\n";
            case "\r": return "\\r";
            case "\b": return "\\b";
            case "\t": return "\\t";
            case "\x1a": return "\\Z";
            default: return "\\" + s;
        }
    });
    return  includeTicks ? "'" + val + "'" : val;
};

var format = function(sql, params) {
    sql = sql.replace(/\?/g, function() {
        if (params.length == 0) {
            throw new Error('too few parameters given');
        }
        return escape(params.shift(), true);
    });
    return sql;
};

var addIsFunction = function(oper, object, callback) {
    object[oper] = function(options) {
        if ((oper == "is" || oper == "isNot") && typeof options != "object") throw new Error("options must be an object {key : value} when using " + oper);
        if ((oper == "isNull" || oper == "isNotNull") && typeof options != "string") throw new Error("options must be a string <columnName> when using " + oper);
        return callback.apply(object, [oper, options]);
    };
};

var addJoinFunction = function(oper, object, callback) {
    object[oper] = function(table, options) {
        return callback.apply(object, [oper, table, options]);
    };
};

var addGroupFunction = function(oper, object, callback) {
    var name = "groupAnd" + oper.charAt(0).toUpperCase() + oper.substr(1);
    object[name] = function(key, options) {
        object.group(key, options);
        return callback.apply(object, [oper, key]);
    };
    addFunction(oper, object, callback);
};

var addFunction = function(oper, object, callback) {
    object[oper] = function(options) {
        return callback.apply(object, [oper, options]);
    };
};

var sqlKeys = ["select", "update", "delete", "count", "set", "from", "where", "group", "having", "order", "limit", "offset"];
var getSQLSection = function(key, sql) {
    var index = sqlKeys.indexOf(key);
    if (index != -1) {
        if ((sqlIndex = sql.search(key)) != -1) {
            var newKeys = sqlKeys.slice(index + 1), l = newKeys.length;
            for (var j = 0; j < l; j++) {
                var newKey = newKeys[j];
                if ((nextIndex = sql.search(newKey)) != -1) {
                    return sql.substr(sqlIndex, nextIndex - sqlIndex);
                }
            }
            return sql.substr(sqlIndex, sql.length - sqlIndex);
        }
    } else {
        throw new Error("sql section does not exists");
    }
    return null;
};

var splitSQL = function(sql) {
    var ret = {sql : sql};
    sqlKeys.forEach(function(key, i) {
        ret[key] = getSQLSection(key, sql);
    });
    return ret;
};

var createSQLFromSplit = function(object) {
    var sql = "", keys = sqlKeys;
    if (object.update) {
        keys = keys.slice(1);
    } else if (object["delete"]) {
        keys = keys.slice(2);
    }
    keys.forEach(function(key, i) {
        if (object[key] != null) {
            if (i > 0 && sql.charAt(sql.length - 1) != ' ') {
                sql += " ";
            }
            sql += object[key];
        }
    });
    return sql;
};

var createInsertStatement = function(table, object, db) {
    var sql = "INSERT INTO " + table + " ";
    var values = [], columns = [];
    for (var i in object) {
        columns.push(i);
        values.push(object[i]);
    }
    sql += "(" + columns.join(",") + ") VALUES ";
    sql += format("(" + values.map(
            function() {
                return "?";
            }).join(",") + ");", values);
    return sql;
};

module.exports = exports = Mysql = utility.define(null, {
    instance : {

        sqlObject : null,

        _needLogic : false,

        table : null,

        db : null,

        constructor: function(table, db) {
            this.sqlObject = {
                "select" : null,
                "update" : null,
                "delete" : null,
                "count" : null,
                "set" : null,
                "from" : null,
                "where" : null,
                "group" : null,
                "having" : null,
                "order" : null,
                "limit" : null,
                "offset" : null
            };
            this._needLogic = false;
            this.table = table;
            this.db = db;
            for (var i in isOperator) {
                addIsFunction(i, this, this._isOp);
            }
            for (i in logicalOperator) {
                addFunction(i, this, this._logicalOp);
            }
            for (i in booleanOperator) {
                addFunction(i, this, this._booleanOp);
            }
            for (i in conditionedJoinTypes) {
                addJoinFunction(i, this, this._joinOp);
            }
            for (i in unConditionedJoinTypes) {
                addJoinFunction(i, this, this._joinOp);
            }
            for (i in inOperator) {
                addFunction(i, this, this._inOp);
            }
            for (i in betweenOperator) {
                addFunction(i, this, this._betweenOp);
            }
            for (i in aggregateOperator) {
                addGroupFunction(i, this, this._aggregateOp);
            }
            for (i in likeOperator) {
                addFunction(i, this, this._likeOp);
            }
        },

        clear : function() {
            this.sqlObject = {
                "select" : null,
                "update" : null,
                "delete" : null,
                "count" : null,
                "set" : null,
                "from" : null,
                "where" : null,
                "group" : null,
                "having" : null,
                "order" : null,
                "limit" : null,
                "offset" : null
            };
        },

        format : function(sql, params) {
            return format(sql, params);
        },

        _from : function(sql) {
            var sqlObject = this.sqlObject;
            if (!sqlObject.from) {
                sqlObject.from = "from " + this.table;
            }
            return this;
        },

        _set : function(vals) {
            var sqlObject = this.sqlObject;
            if (sqlObject.update) {
                if (!sqlObject.set) {
                    sqlObject.set = "set ";
                }
                if (typeof vals == "object" && !(vals instanceof Array)) {
                    var values = [];
                    var set = [];
                    for (var i in vals) {
                        set.push(i + "=?");
                        values.push(vals[i]);
                    }
                    sqlObject.set += this.format(set.join(","), values);
                } else {
                    throw new Error("Vals must be an object");
                }
            }
            return this;
        },

        _betweenOp : function(oper, options) {
            if (!this.sql) this.find();
            if (options) {
                var sqlObject = this.sqlObject;
                if (sqlObject.having) {
                    this.having();
                } else if (!sqlObject.where) {
                    this.where();
                }
                for (var i in options) {
                    if (this._needLogic) {
                        this.and();
                    }
                    var key = i, val = options[i];
                    if (val instanceof Array && val.length == 2) {
                        var opts = {};
                        if (oper == "between") {
                            opts[key] = val[0];
                            this.gte(opts);
                            opts[key] = val[1];
                            this.lte(opts);
                        } else if (oper == "notBetween") {
                            opts[key] = val[0];
                            this.lte(opts);
                            opts[key] = val[1];
                            this.gte(opts);
                        } else {
                            throw new Error(oper + " is not supported");
                        }
                        this._needLogic = true;
                    } else {
                        throw new Error("when calling between value must be an array and have a of length 2");
                    }
                }
            }
            return this;
        },

        _inOp : function(oper, options) {
            if (!this.sql) this.find();
            if (options) {
                oper = inOperator[oper];
                var sqlObject = this.sqlObject;
                var sqlKey = "where";
                if (sqlObject.having) {
                    this.having();
                    sqlKey = "having";
                } else if (!sqlObject.where) {
                    this.where();
                }
                for (var i in options) {
                    if (this._needLogic) {
                        this.and();
                    }
                    var key = i, val = options[i];
                    if (val instanceof Mysql) {
                        sqlObject[sqlKey] += key + " " + oper + " (" + val.sql + ")";
                        this._needLogic = true;
                    } else if (val instanceof Array) {
                        var vals = "";
                        vals = val.map(function() {
                            return "?";
                        });
                        sqlObject[sqlKey] += key + " " + oper + " (" + this.format(vals.join(","), val) + ")";
                        this._needLogic = true;
                    } else if (typeof val == "string") {
                        sqlObject[sqlKey] += key + " in (" + val + ")";
                        this._needLogic = true;
                    } else {
                        throw new Error("when calling in value must be a string or array");
                    }
                }
            }
            return this;
        },

        _aggregateOp : function(oper, options) {
            var op = aggregateOperator[oper];
            var sqlObject = this.sqlObject;
            if (sqlObject.update || sqlObject["delete"]) throw new Error(oper + " cannot be used with update or delete");
            this._aggregated = true;
            if (options) {
                if (typeof options == "string") {
                    if (sqlObject.select) {
                        var lastChar = sqlObject.select.charAt(sqlObject.select.length - 1);
                        if (sqlObject != "select" && lastChar == "*" || lastChar == ' ') {
                            sqlObject.select += ", ";
                        }
                    } else {
                        sqlObject.select = "select ";
                    }
                    sqlObject.select += op + "(" + options + ") as " + options + "_" + op;
                } else if (options instanceof Array) {
                    options.forEach(this.count, this);
                } else {
                    throw new Error("when calling " + oper + " you must pass in a string or array or nothing");
                }
            } else {
                if (sqlObject.select) {
                    if (sqlObject.select.charAt(sqlObject.select.length - 1) == " ") {
                        sqlObject.select = sqlObject.select.substr(0, sqlObject.select.length - 1) + ", ";
                    }
                } else {
                    sqlObject.select = "select ";
                }
                sqlObject.select += op + "(*) as " + op;
            }
            if (!sqlObject.find) this._from();
            return this;
        },

        _parseObjectAndCreateSQL : function(options) {
            if (options) {
                /*if (typeof options == "string") {
                 var args = Array.prototype.slice.call(arguments);
                 if (args.length > 1) {
                 var sql = args.shift;
                 this.sql += this.format(sql, args);
                 } else {
                 //assume it is raw sql
                 this.sql += options;
                 }
                 } else */
                if (typeof options == "object") {
                    var params = [], count = 0;
                    for (var i in options) {
                        if (count) {
                            var opts = {};
                            opts[i] = options[i];
                            this.and(opts);
                        } else {
                            this._createSQLFromObject(i, options[i]);
                        }
                        count++;
                    }
                } else {
                    throw new Error("Options must be of type string or object");
                }
            }
        },

        _createSQLFromObject : function(key, val) {
            var params = [], count = 0, opts;
            if (val instanceof Array) {
                //assume its an in
                opts = {};
                opts[key] = val;
                this["in"](opts);
            } else if (typeof val === "object") {
                for (var j in val) {
                    if (j in this) {
                        opts = {};
                        opts[key] = val[j];
                        this[j](opts);
                    } else {
                        throw new Error("Operation " + j + " is not supported");
                    }
                }
            } else {
                //assume its equals
                opts = {};
                opts[key] = val;
                this.eq(opts);

            }
            return this;
        },

        _logicalOp : function(oper, options) {
            oper = logicalOperator[oper];
            if (this._needLogic) {
                var sqlObject = this.sqlObject;
                var sqlKey = "where";
                if (sqlObject.having) {
                    //this.having();
                    sqlKey = "having";
                } else if (!sqlObject.where) {
                    this.where();
                }
                sqlObject[sqlKey] += " " + logicalOperator[oper] + " ";
                this._needLogic = false;
                if (options) {
                    var params = [];
                    var count = 0;
                    for (var i in options) {
                        if (count) throw new Error(oper + "operation can only be one deep");
                        this._createSQLFromObject(i, options[i]);
                        count++;
                    }
                }
            } else {
                throw new Error("logical operator not needed");
            }
            return this;
        },

        _joinOp : function(oper, table, options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            var fromClause = "from";

            if (!sqlObject.update && !sqlObject.from) {
                this._from();
            } else if (sqlObject.update) {
                fromClause = "update";
            }
            if (typeof table == "string") {
                if (sqlObject["delete"]) {
                    if (sqlObject["delete"] == "delete ") {
                        sqlObject["delete"] += this.table;
                    }
                }
                var joinType;
                if (oper in conditionedJoinTypes) {
                    if (options) {
                        joinType = conditionedJoinTypes[oper];
                        sqlObject[fromClause] += " " + joinType + " " + table;
                        if (options instanceof Array) {
                            sqlObject[fromClause] += " using (" + options.join(", ") + ")";
                        } else if (typeof options == "object") {
                            sqlObject[fromClause] += " on ";
                            for (var i in options) {
                                sqlObject[fromClause] += this.table + "." + i + "=" + table + "." + options[i];
                            }
                        } else {
                            throw new Error("join options must be an array or object");
                        }
                    } else {
                        throw new Error(oper + " requires a join condition");
                    }
                } else if (oper in unConditionedJoinTypes) {
                    joinType = unConditionedJoinTypes[oper];
                    sqlObject[fromClause] += " " + joinType + " " + table;
                }
            } else if (table instanceof Mysql) {
                //this._joinOp(oper, table.sql, options);
            }
            return this;
        },

        _booleanOp : function(oper, options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            var sqlKey = "where";
            if (sqlObject.having) {
                //this.having();
                sqlKey = "having";
            } else if (!sqlObject.where) {
                this.where();
            }
            oper = booleanOperator[oper];
            var params = [];
            for (var i in options) {
                if (this._needLogic) {
                    this.and();
                }
                sqlObject[sqlKey] += this.format(i + " " + oper + " ?", [options[i]]);
                this._needLogic = true;
            }
            return this;
        },

        _isOp : function(oper, options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            var sqlKey = "where";
            if (sqlObject.having) {
                this.having();
                sqlKey = "having";
            } else if (!sqlObject.where) {
                this.where();
            }
            oper = isOperator[oper];
            var sql = "";
            if (typeof options == "object") {
                for (var i in options) {
                    if (this._needLogic) {
                        this.and();
                    }
                    sqlObject[sqlKey] += i + " " + oper + " " + transformBooleanOperator(options[i]);
                    this._needLogic = true;
                }
            } else {
                if (this._needLogic) {
                    this.and();
                }
                sqlObject[sqlKey] += options + " " + oper;
                this._needLogic = true;
            }
            return this;
        },

        _likeOp : function(oper, options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            var sqlKey = "where";
            if (sqlObject.having) {
                this.having();
                sqlKey = "having";
            } else if (!sqlObject.where) {
                this.where();
            }
            oper = likeOperator[oper];
            var sql = "";
            if (typeof options == "object") {
                for (var i in options) {
                    if (this._needLogic) {
                        this.and();
                    }
                    sqlObject[sqlKey] += this.format(i + " " + oper + " ?", [options[i]]);
                    this._needLogic = true;
                }
            } else {
                throw new Error("when calling like options must be a hash of {columnName : <like condition>}");
            }
            return this;
        },

        where : function(options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            if (!sqlObject.update && !sqlObject.from) {
                this._from();
            }
            if (!sqlObject.where) {
                sqlObject.where = "where ";
            }
            this._parseObjectAndCreateSQL(options);
            return this;
        },

        select : function(values, options) {
            var sqlObject = this.sqlObject;
            if (!sqlObject.update && !sqlObject["delete"]) {
                if (!sqlObject.select || sqlObject.select.indexOf("*") != -1) {
                    sqlObject.select = "select ";
                }
                if (values) {
                    if (typeof values == "string") {
                        sqlObject.select += values;
                    } else if (values instanceof Array) {
                        for (var i in values) {
                            var val = values[i];
                            if (typeof val == "string") {
                                if (i > 0) sqlObject.select += ", ";
                                sqlObject.select += val;
                            } else {
                                throw new Error("select params must be a string");
                            }
                        }
                    }
                }
                if (options) {
                    this.where(options);
                }
            } else {
                throw new Error("Cannot call select after update or delete");
            }
            return this;
        },

        update : function(values, options) {
            var sqlObject = this.sqlObject;
            if (!sqlObject.select && !sqlObject["delete"]) {
                if (values) {
                    if (!sqlObject.update) {
                        sqlObject.update = "update " + this.table;
                    }
                    this._set(values);
                    if (options) {
                        this.where(options);
                    }
                } else {
                    throw new Error("To call update you must provide values to update");
                }
            } else {
                throw new Error("Cannot call udpate after select or delete!");
            }
            return this;
        },

        remove : function(values, options) {
            var sqlObject = this.sqlObject;
            if (!sqlObject.update && !sqlObject["delete"]) {
                if (!sqlObject["delete"]) {
                    sqlObject["delete"] = "delete ";
                }
                if (values) {
                    if (sqlObject["delete"] == "delete ") {
                        sqlObject["delete"] += this.table;
                    }
                    if (typeof values == "string") {
                        sqlObject["delete"] += ", " + values;
                    } else if (values instanceof Array) {
                        sqlObject["delete"] += ", " + values.join(", ");
                    }
                } else if (!sqlObject.from) {
                    this._from();
                }
                if (options) {
                    this.where(options);
                }
            } else {
                throw new Error("Cannot call delete after update or delete");
            }
            return this;
        },

        /*
         options = {name : "fred"},
         select * from <table> where name = 'fred'
         options = {x : {gt : 2}}
         select * from <table> where x > 2
         options = {x : {lt : 2}}
         select * from <table> where x < 2
         options = {x : {gte : 2}}
         select * from <table> where x >= 2
         options = {x : {lte : 2}}
         select * from <table> where x <= 2
         options = {x : {in : [1, 2, 3]}}
         select * from <table> where x in (1,2,3);
         options = {x : {ne : 2}}
         select * from <table> where x != 2;
         options = {flag : {is : (TRUE|FALSE|UNKNOWN)}}
         select * from <table> where flag is (TRUE|FALSE|UNKNOWN);
         options = {flag : {isNot : (TRUE|FALSE|UNKNOWN)}}
         select * from <table> where flag IS NOT (TRUE|FALSE|UNKNOWN);
         options = {x : {isNull : (TRUE|FALSE|UNKNOWN)}}
         select * from <table> where flag IS NULL;
         options = {x : {isNotNull : (TRUE|FALSE|UNKNOWN)}}
         select * from <table> where flag IS NOT NULL;
         options = {x : {between : [1,5]}}
         select * from <table> where x BETWEEN 1 AND 5;
         options = {x : {notBetween : [1,5]}}
         select * from <table> where x NOT BETWEEN 1 AND 5;
         options = {name : {like : "Fred"}}
         select * from <table> where x NOT BETWEEN 1 AND 5;
         */
        find : function(options) {
            //reset sql
            var sqlObject = this.sqlObject;
            if (!sqlObject.select && !sqlObject.update && !sqlObject["delete"]) {
                sqlObject.select = "select *";
            }
            if (!sqlObject.update && !sqlObject.from) this._from();
            if (options) {
                if (sqlObject.having) {
                    this.having(options);
                } else {
                    this.where(options);
                }
            }
            return this;
        },

        /*
         *   add order tp query
         *   mysql.order(x)
         *   select * from <table> order by x
         *   mysql.order([x,y])
         *   select * from <table> order by x,y
         *   mysql.order({x : "desc"})
         *   select * from <table> order by x desc
         *   mysql.order([{x : "desc"}, y])
         *   select * from <table> order by x desc, y
         *   mysql.order([{x : "desc"}, {y : desc}])
         *   select * from <table> order by x desc, y desc

         */
        order : function(options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            if (!sqlObject.from) {
                this._from();
            }
            if (options) {
                if (!sqlObject.order) {
                    sqlObject.order = "order by ";
                    this._orderedCount = 0;
                } else if (this._orderedCount) {
                    sqlObject.order += ", ";
                }
                if (typeof options == "string") {
                    sqlObject.order += options;
                } else if (options instanceof Array) {
                    options.forEach(this.order, this);
                } else if (typeof options == "object") {
                    var count = 0;
                    for (var i in options) {
                        if (count) throw new Error("when providing an object to order only one key is allowed");
                        var type = options[i];
                        if (type == 'desc' || type == "asc") {
                            sqlObject.order += i + " " + type;
                        } else {
                            throw new Error("Only 'asc' or 'desc' is allowed as a value for an ordered object");
                        }
                    }
                }
                this._orderedCount++;
            }
            return this;
        },

        orderBy : function(options) {
            return this.order(options);
        },

        clearOrder : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.order;
            return this;
        },

        limit : function(limit, offset) {
            var sqlObject = this.sqlObject;
            if (!sqlObject.update && !sqlObject.from) {
                this.find();
            }
            if (limit) {
                if (typeof limit == "number") {
                    sqlObject.limit = "limit " + limit;
                } else {
                    throw new Error("when using limit the param must be a number");
                }
            }
            offset && this.offset(offset);
            return this;
        },

        clearLimit : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.limit;
            return this;
        },

        offset : function(offset) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            if (!sqlObject.update && !sqlObject["delete"]) {
                if (!sqlObject.from) {
                    this._from();
                }
                if (offset) {
                    if (typeof offset == "number") {
                        sqlObject.offset = "offset " + offset;
                    } else {
                        throw new Error("when using limit the param must be a number");
                    }
                }
            } else {
                throw new Error("Cannot call limit on update or delete");
            }
            return this;
        },

        clearOffset : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.offset;
            return this;
        },

        /*
         *   mysql.join(<tablename>, options);
         *   select * from inner join <thisTable
         * */
        join : function(table, options) {
            return this._joinOp("innerJoin", table, options);

        },

        /*
         * Creats a group clause for sql
         * mysql.group(<columnName>);
         * select * from <tableName> group by <columnName>
         * mysql.group([col1,col2...]);
         * select * from <tableName> group by col1, col2...
         * mysql.group(col, havingOptions);
         * select * from <tableName> group by col having <having options>
         * mysql.group([col1, col2...], {col1 : a});
         * select * from <tableName> group by col1, col2.... having col2 = 'a'
         * */
        group : function(key, options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            if (!sqlObject.update && !sqlObject["delete"]) {
                if (!sqlObject.from) {
                    this._from();
                }
                if (key) {
                    if (typeof key == "string") {
                        if (!sqlObject.group) {
                            sqlObject.group = "group by";
                        }
                        sqlObject.group += " " + key;
                    } else if (key instanceof Array) {
                        if (!sqlObject.group) {
                            sqlObject.group = "group by";
                        }
                        sqlObject.group += " " + key.join(", ");
                    } else {
                        throw new Error("key must be a string or array");
                    }
                    if (sqlObject.group && options) {
                        this.having(options);
                    }
                } else {
                    throw new Error("when calling group a grouping column is required");
                }
            } else {
                throw new Error("Cannot group on an update or delete");
            }
            return this;
        },

        /*
         * Creates a having clause, group must have been previously called
         * mysql.having({x : 1});
         * select * from <tableName> group by <*> having x = 1
         * you may also use find if a group clause has been defined
         * */
        having : function(options) {
            var sqlObject = this.sqlObject;
            if (sqlObject.group) {
                if (!sqlObject.having) {
                    sqlObject.having = "having ";
                    this._needLogic = false;
                }
                if (options) {
                    this._parseObjectAndCreateSQL(options);
                }
            } else {
                throw new Error("a group clause must be previously defined");
            }
            return this;
        },

        clearHaving : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.having;
            return this;
        },

        logicGroup : function(options) {
            if (!this.sql) this.find();
            var sqlObject = this.sqlObject;
            var sqlKey = "where";
            if (sqlObject.having) {
                this.having();
                sqlKey = "having";
            } else if (!sqlObject.where) {
                this.where();
            }
            if (options) {
                sqlObject[sqlKey] += "(";
                this.where(options);
                sqlObject[sqlKey] += ")";
            }
            return this;
        },

        /*call this to finish off select clause and not execute
         *else just call execute();
         *i.e you just call mysql.find() or mysql.select(params);
         *mysql.find.end(); mysql.find.select().end();
         * */
        end : function() {
            var sqlObject = this.sqlObject;
            if(!sqlObject.select && !sqlObject.update && !sqlObject["delete"]){
                this.find();
            }
            if (sqlObject.select) {
                if (!sqlObject.from) this._from();
            }
            return this;
        },

        exec : function() {
            var promise = new Promise();
            this.end();
            this.db.query(this.sql).then(hitch(promise, "callback"), hitch(promise, "errback"));
            return promise;
        },

        close : function() {
            this.db.close();
        }
    },

    getters : {
        sql : function() {
            return createSQLFromSplit(this.sqlObject);
        }
    },

    static : {
        createTable : function(table, db) {
            var promise = new Promise();
            db.query(table.createTableSql).then(hitch(promise, "callback", true), hitch(promise, "errback"));
            return promise;
        },

        alterTable : function(table, db) {
            var promise = new Promise();
            db.query(table.alterTableSql).then(hitch(promise, "callback", true), hitch(promise, "errback"));
            return promise;
        },

        dropTable : function(table, db) {
            var promise = new Promise();
            db.query(table.dropTableSql).then(hitch(promise, "callback", true), hitch(promise, "errback"));
            return promise;
        },

        save : function(table, object, db) {
            if (table && object && db) {
                var promise = new Promise();
                var sql = "";
                if (object instanceof Array) {
                    sql = object.map(
                            function(o) {
                                return createInsertStatement(table, o, db);
                            }).join("");
                } else {
                    sql = createInsertStatement(table, object, db);
                }
                db.query(sql).then(hitch(promise, "callback"), hitch(promise, "errback"));
                return promise;
            } else {
                throw new Error("Table, object, and db required when calling mysql.save");
            }
        },

        schema : function(tableName, db) {
            if(typeof tableName != "string") throw new Error("tablename must be a string");
            if (tableName && db) {
                var promise = new Promise();
                db.query("DESCRIBE " + escape(tableName)).then(function(results) {
                    var obj = {};
                    if (results.length) {
                        var schema = {};
                        var pks = [];
                        results.forEach(function(o){
                            var t = mysqlTypes.fromColDef(o);
                            if(t.isPrimaryKey()){
                                pks.push(o.Field);
                            }
                            schema[o.Field] = t;
                        });
                        pks.length && (schema.primaryKey = pks);
                        promise.callback(new Table(tableName, schema));
                    }else{
                      promise.callback(null);
                    }
                }, hitch(promise, "errback"));
                return promise;
            } else {
                throw new Error("Table name and db conneciton required to retrieve schema");
            }
        },

        getLastInsertId : function(db) {
            var promise = new Promise();
            var sql = "SELECT LAST_INSERT_ID() as id";
            db.query(sql).then(hitch(promise, "callback"), hitch(promise, "errback"));
            return promise;
        },

        foreignKey : mysqlTypes.foreignKey,
        addForeignKey : mysqlTypes.addForeignKey,
        dropForeignKey : mysqlTypes.dropForeignKey,
        primaryKey : mysqlTypes.primaryKey,
        addPrimaryKey : mysqlTypes.addPrimaryKey,
        dropPrimaryKey : mysqlTypes.dropPrimaryKey,
        unique : mysqlTypes.unique,
        addUnique : mysqlTypes.addUnique,
        dropUnique : mysqlTypes.dropUnique,
        dropColumn : mysqlTypes.dropColumn,
        alterColumn : mysqlTypes.alterColumn,
        column : mysqlTypes.column,
        addColumn : mysqlTypes.addColumn,
        isValidType : mysqlTypes.isValidType,
        client : require("./clients/mysql"),
        types : mysqlTypes.types

    }
});






