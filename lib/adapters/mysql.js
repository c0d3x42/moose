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
for (var i in unConditionedJoinTypes) {
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
        throw new Error(val + " is not a boolean type")
    }
    return val;
};

var addIsFunction = function(oper, object, callback) {
    object[oper] = function(options) {
        if ((oper == "is" || oper == "isNot") && typeof options != "object") throw new Error("options must be an object {key : value} when using " + oper);
        if ((oper == "isNull" || oper == "isNotNull") && typeof options != "string") throw new Error("options must be a string <columnName> when using " + oper);
        return callback.apply(object, [oper, options])
    }
};

var addJoinFunction = function(oper, object, callback) {
    object[oper] = function(table, options) {
        return callback.apply(object, [oper, table, options])
    }
};

var addGroupFunction = function(oper, object, callback) {
    var name = "groupAnd" + oper.charAt(0).toUpperCase() + oper.substr(1);
    object[name] = function(key, options) {
        object.group(key, options);
        return callback.apply(object, [oper, key]);
    }
    addFunction(oper, object, callback);
};

var addFunction = function(oper, object, callback) {
    object[oper] = function(options) {
        return callback.apply(object, [oper, options])
    }
};

var sqlKeys = ["select", "from", "where", "group", "having", "order", "limit", "offset"];
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
        throw new Error("sql section does not exists")
    }
    return null;
}

var splitSQL = function(sql) {
    var ret = {sql : sql};
    sqlKeys.forEach(function(key, i) {
        ret[key] = getSQLSection(key, sql);
    });
    return ret;
};

var createSQLFromSplit = function(object) {
    var sql = "";
    sqlKeys.forEach(function(key, i) {
        if (object[key] != null) {
            if (i > 0 && sql.charAt(sql.length - 1) != ' ') {
                sql += " ";
            }
            sql += object[key];
        }
    });
    return sql;
}

exports.mysql = (mysql = function(table, db) {
    this.sql = "";
    this._needLogic = false;
    this._ordered = false;
    this._isWhere = false;
    this._isFrom
    false;
    this.table = table;
    this.db = db;
    this.format = function(sql, params) {
        return db.format(sql, params)
    };
    for (var i in isOperator) {
        addIsFunction(i, this, this._isOp);
    }
    for (var i in logicalOperator) {
        addFunction(i, this, this._logicalOp);
    }
    for (var i in booleanOperator) {
        addFunction(i, this, this._booleanOp)
    }
    for (var i in conditionedJoinTypes) {
        addJoinFunction(i, this, this._joinOp)
    }
    for (var i in unConditionedJoinTypes) {
        addJoinFunction(i, this, this._joinOp)
    }
    for (var i in inOperator) {
        addFunction(i, this, this._inOp);
    }
    for (var i in betweenOperator) {
        addFunction(i, this, this._betweenOp);
    }
    for (var i in aggregateOperator) {
        addGroupFunction(i, this, this._aggregateOp);
    }
    for (var i in likeOperator) {
        addFunction(i, this, this._likeOp);
    }
});

mysql.prototype._from = function(sql) {
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.from) {
        sqlObject.from = "from " + this.table;
    }
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype._betweenOp = function(oper, options) {
    if (!this.sql) this.find();
    if (options) {
        var sqlObject = splitSQL(this.sql);
        if (sqlObject.having) {
            this.having();
        } else if (!sqlObject.where) {
            this.where();
        }
        for (var i in options) {
            if (this._needLogic) {
                this.sql = createSQLFromSplit(sqlObject);
                this.and();
            }
            var key = i, val = options[i];
            if (val instanceof Array && val.length == 2) {
                var opts = {};
                if (oper == "between") {
                    opts[key] = val[0];
                    this.gte(opts);
                    opts[key] = val[1];
                    this.lte(opts)
                } else if (oper == "notBetween") {
                    opts[key] = val[0];
                    this.lte(opts);
                    opts[key] = val[1];
                    this.gte(opts)
                } else {
                    throw new Error(oper + " is not supported")
                }
                this._needLogic = true;
            } else {
                throw new Error("when calling between value must be an array and have a of length 2");
            }
        }
    }
    return this
};

mysql.prototype._inOp = function(oper, options) {
    if (!this.sql) this.find();
    if (options) {
        oper = inOperator[oper];
        var sqlObject = splitSQL(this.sql);
        var sqlKey = "where";
        if (sqlObject.having) {
            this.having();
            sqlKey = "having";
        } else if (!sqlObject.where) {
            this.where();
        }
        var sqlObject = splitSQL(this.sql);
        for (var i in options) {
            if (this._needLogic) {
                this.sql = createSQLFromSplit(sqlObject);
                this.and();
                sqlObject = splitSQL(this.sql);
                ;
            }
            var key = i, val = options[i];
            if (val instanceof Array) {
                var vals = "";
                vals = val.map(function() {
                    return "?"
                });
                sqlObject[sqlKey] += key + " " + oper + " (" + this.format(vals.join(","), val) + ")";
                this._needLogic = true;
            } else if (typeof val == "string") {
                sqlObject[sqlKey] += key + "in (" + this.format("?", [val]) + ")";
                sqlObject[sqlKey] += val;
                this._needLogic = true;
            } else {
                throw new Error("when calling in value must be a string or array");
            }
        }
    }
    this.sql = createSQLFromSplit(sqlObject);
    return this
};

mysql.prototype._aggregateOp = function(oper, options) {

    var op = aggregateOperator[oper];
    var sqlObject = splitSQL(this.sql);
    if (options) {
        if (typeof options == "string") {
            if (sqlObject.select) {
                if (sqlObject.select.charAt(sqlObject.select.length - 1) == " ") {
                    sqlObject.select = sqlObject.select.substr(0, sqlObject.select.length - 1) + ", ";
                }
            } else {
                sqlObject.select = "select ";
            }
            sqlObject.select += op + "(" + options + ") as " + options + "_" + op;
            this.sql = createSQLFromSplit(sqlObject);
        } else if (options instanceof Array) {
            options.forEach(this.count, this);
        } else {
            throw new Error("when calling " + oper + " you must pass in a string or array or nothing")
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
        this.sql = createSQLFromSplit(sqlObject);
    }
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.find) this._from();
    return this;
};

mysql.prototype._parseObjectAndCreateSQL = function(options) {
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
                    opts = {};
                    opts[i] = options[i];
                    this.and(opts);
                } else {
                    this._createSQLFromObject(i, options[i]);
                }
                count++;
            }
        } else {
            throw new Error("Options must be of type string or object")
        }
    }
}

mysql.prototype._createSQLFromObject = function(key, val) {
    var params = [], count = 0;
    if (val instanceof Array) {
        //assume its an in
        var opts = {};
        opts[key] = val;
        this.in(opts);
    } else if (typeof val === "object") {
        for (var j in val) {
            if (j in this) {
                var opts = {};
                opts[key] = val[j];
                this[j](opts);
            } else {
                throw new Error("Operation " + j + " is not supported");
            }
        }
    } else {
        //assume its equals
        var opts = {};
        opts[key] = val;
        this.eq(opts);

    }
    return this;
};

mysql.prototype._logicalOp = function(oper, options) {
    oper = logicalOperator[oper];
    if (this._needLogic) {
        var sqlObject = splitSQL(this.sql);
        var sqlKey = "where";
        if (sqlObject.having) {
            this.having();
            sqlKey = "having";
        } else if (!sqlObject.where) {
            this.where();
        }
        var sqlObject = splitSQL(this.sql);
        sqlObject[sqlKey] += " " + logicalOperator[oper] + " ";
        this.sql = createSQLFromSplit(sqlObject);
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
};

mysql.prototype._joinOp = function(oper, table, options) {
    if (!this._isWhere && !this._isGroup && !this._isOrder) {
        if (!this.sql) this.find();
        var sqlObject = splitSQL(this.sql);
        var sqlKey = "from";
        if (!sqlObject.from) {
            this._from();
        }
        var sqlObject = splitSQL(this.sql);
        if (typeof table == "string") {
            if (oper in conditionedJoinTypes) {
                if (options) {
                    var joinType = conditionedJoinTypes[oper];
                    sqlObject.from += " " + joinType + " " + table;
                    if (options instanceof Array) {
                        sqlObject.from += " using (" + options.join(", ") + ")";
                    } else if (typeof options == "object") {
                        sqlObject.from += " on ";
                        for (var i in options) {
                            sqlObject.from += this.table + "." + i + "=" + table + "." + options[i]
                        }
                    } else {
                        throw new Error("join options must be an array or object")
                    }
                } else {
                    throw new Error(oper + " requires a join condition")
                }
            } else if (oper in unConditionedJoinTypes) {
                var joinType = unConditionedJoinTypes[oper];
                sqlObject.from += " " + joinType + " " + table;
            }
        }
    } else {
        throw new Error("join must be before where clause")
    }
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype._booleanOp = function(oper, options) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    var sqlKey = "where";
    if (sqlObject.having) {
        this.having();
        sqlKey = "having";
    } else if (!sqlObject.where) {
        this.where();
    }
    var sqlObject = splitSQL(this.sql);
    oper = booleanOperator[oper];
    var params = [];
    for (var i in options) {
        if (this._needLogic) {
            this.sql = createSQLFromSplit(sqlObject);
            this.and();
            sqlObject = splitSQL(this.sql);
        }
        sqlObject[sqlKey] += this.format(i + " " + oper + " ?", [options[i]]);
        this._needLogic = true;
    }
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype._isOp = function(oper, options) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    var sqlKey = "where";
    if (sqlObject.having) {
        this.having();
        sqlKey = "having";
    } else if (!sqlObject.where) {
        this.where();
    }
    sqlObject = splitSQL(this.sql);
    oper = isOperator[oper];
    var sql = "";
    if (typeof options == "object") {
        for (var i in options) {
            if (this._needLogic) {
                this.sql = createSQLFromSplit(sqlObject);
                this.and();
                sqlObject = splitSQL(this.sql);
            }
            sqlObject[sqlKey] += i + " " + oper + " " + transformBooleanOperator(options[i]);
            this._needLogic = true;
        }
    } else {
        if (this._needLogic) {
            this.sql = createSQLFromSplit(sqlObject);
            this.and();
            sqlObject = splitSQL(this.sql);
        }
        sqlObject[sqlKey] += options + " " + oper;
        this._needLogic = true;
    }
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype._likeOp = function(oper, options) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    var sqlKey = "where";
    if (sqlObject.having) {
        this.having();
        sqlKey = "having";
    } else if (!sqlObject.where) {
        this.where();
    }
    sqlObject = splitSQL(this.sql);
    oper = likeOperator[oper];
    var sql = "";
    if (typeof options == "object") {
        for (var i in options) {
            if (this._needLogic) {
                this.sql = createSQLFromSplit(sqlObject);
                this.and();
                sqlObject = splitSQL(this.sql);
            }
            sqlObject[sqlKey] += this.format(i + " " + oper + " ?", [options[i]]);
            this._needLogic = true;
        }
    } else {
        throw new Error("when calling like options must be a hash of {columnName : <like condition>}")
    }
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype.where = function(options) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.from) this._from();
    var sqlKey = "where";
    if (!sqlObject.where) {
        sqlObject.where = "where ";
    }
    this.sql = createSQLFromSplit(sqlObject);
    this._parseObjectAndCreateSQL(options);
    return this;
};
mysql.prototype.select = function(values, options) {
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.select || sqlObject.select.indexOf("*") != -1) {
        sqlObject.select = "select ";
    }
    if (values) {
        if (typeof values == "string") {
            sqlObject.select += values
        } else if (values instanceof Array) {
            for (var i in values) {
                var val = values[i];
                if (typeof val == "string") {
                    if (i > 0) sqlObject.select += ", ";
                    sqlObject.select += val;
                } else {
                    throw new Error("select params must be a string")
                }
            }
        }
    }
    this.sql = createSQLFromSplit(sqlObject);
    if (options) {
        this.where(options);
    }
    return this;
};

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
mysql.prototype.find = function(options) {
    //reset sql
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.select) sqlObject.select = "select *";
    this.sql = createSQLFromSplit(sqlObject);
    if (!sqlObject.from) this._from();
    if (options) {
        if (sqlObject.having) {
            this.having(options);
        } else {
            this.where(options);
        }
    }
    return this
};

mysql.prototype.between = function(options) {

};
mysql.prototype.notBetween = function(options) {
};

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
mysql.prototype.order = function(options) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.from) {
        this._from();
    }
    var sqlObject = splitSQL(this.sql);
    if (options) {
        if (!sqlObject.order) {
            sqlObject.order = "order by ";
            this._orderedCount = 0;
            this._ordered = true;
        } else if (this._orderedCount) {
            sqlObject.order += ", ";
        }
        if (typeof options == "string") {
            sqlObject.order += options;
            this.sql = createSQLFromSplit(sqlObject);
        } else if (options instanceof Array) {
            this.sql = createSQLFromSplit(sqlObject);
            options.forEach(this.order, this);
        } else if (typeof options == "object") {
            var count = 0;
            for (var i in options) {
                if (count) throw new Error("when providing an object to order only one key is allowed");
                var type = options[i];
                if (type == 'desc' || type == "asc") {
                    sqlObject.order += i + " " + type;
                } else {
                    throw new Error("Only 'asc' or 'desc' is allowed as a value for an ordered object")
                }
            }
            this.sql = createSQLFromSplit(sqlObject);
        }
        this._orderedCount++;
    }
    return this;
};
mysql.prototype.orderBy = function(options) {
    return this.order(options);
};

mysql.prototype.clearOrder = function() {
    var sqlObject = splitSQL(this.sql);
    delete sqlObject.order;
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype.limit = function(limit, offset) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.from) {
        this._from();
    }
    var sqlObject = splitSQL(this.sql);
    if (limit) {
        if (typeof limit == "number") {
            sqlObject.limit = "limit " + limit;
        } else {
            throw new Error("when using limit the param must be a number");
        }
    }
    this.sql = createSQLFromSplit(sqlObject);
    offset && this.offset(offset);
    return this;
};

mysql.prototype.clearLimit = function() {
    var sqlObject = splitSQL(this.sql);
    delete sqlObject.limit;
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype.offset = function(offset) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.from) {
        this._from();
    }
    var sqlObject = splitSQL(this.sql);
    if (offset) {
        if (typeof offset == "number") {
            sqlObject.offset = "offset " + offset;
        } else {
            throw new Error("when using limit the param must be a number");
        }
    }
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype.clearOffset = function() {
    var sqlObject = splitSQL(this.sql);
    delete sqlObject.offset;
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};


/*
 *   mysql.join(<tablename>, options);
 *   select * from natural join <thisTable
 * */
mysql.prototype.join = function(table, options) {
    return this._joinOp("innerJoin", table, options);

};

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
mysql.prototype.group = function(key, options) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    if (!sqlObject.from) {
        this._from();
    }
    var sqlObject = splitSQL(this.sql);
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
            throw new Error("key must be a string or array")
        }
        this.sql = createSQLFromSplit(sqlObject);
        if (sqlObject.group && options) {
            this.having(options);
        }
    } else {
        throw new Error("when calling group a grouping column is required")
    }
    return this;
};

/*
 * Creates a having clause, group must have been previously called
 * mysql.having({x : 1});
 * select * from <tableName> group by <*> having x = 1
 * you may also use find if a group clause has been defined
 * */
mysql.prototype.having = function(options) {
    var sqlObject = splitSQL(this.sql);
    if (sqlObject.group) {
        if (!sqlObject.having) {
            sqlObject.having = "having ";
            this._needLogic = false;
        }
        this.sql = createSQLFromSplit(sqlObject);
        if (options) {
            this._parseObjectAndCreateSQL(options);
        }
    } else {
        throw new Error("a group clause must be previously defined");
    }
    return this;
};

mysql.prototype.clearHaving = function() {
    var sqlObject = splitSQL(this.sql);
    delete sqlObject.having;
    this.sql = createSQLFromSplit(sqlObject);
    return this;
};

mysql.prototype.logicGroup = function(options) {
    if (!this.sql) this.find();
    var sqlObject = splitSQL(this.sql);
    var sqlKey = "where";
    if (sqlObject.having) {
        this.having();
        sqlKey = "having";
    } else if (!sqlObject.where) {
        this.where();
    }
    var sqlObject = splitSQL(this.sql);
    if (options) {
        sqlObject[sqlKey] += "(";
        this.sql = createSQLFromSplit(sqlObject);
        this.where(options);
        var sqlObject = splitSQL(this.sql);
        sqlObject[sqlKey] += ")";
        this.sql = createSQLFromSplit(sqlObject);
    }
    return this;
};


//call this to finish off select clause and not execute
//else just call execute();
//i.e you just call mysql.find() or mysql.select(params);
//mysql.find.end(); mysql.find.select().end();
mysql.prototype.end = function() {
    if (!this._isFrom) this._from();
    return this;
};

mysql.types = {
    STRING :        {sqlName : "varchar"},
    BINARY :        {sqlName : "binary"},
    CHAR :          {sqlName : "char"},
    CHARSET :       {sqlName : "charset}"
    BINARY :        {sqlName : "binary"},
    VAR_BINARY :    {sqlName : "varbinary"},
    TINY_TEXT :     {sqlName : "tinytext"},
    LONG_TEXT :     {sqlName : "longtext"},
    TEXT :          {sqlName : "text"},
    ENUM :          {sqlName : "enum"},
    SET :           {sqlName : "set"},
    TINY_BLOB :     {sqlName : "tinyblob"},
    MEDIUM_BLOB :   {sqlName : "mediumblob"},
    LONG_BLOB :     {sqlName : "longblob"},
    BLOB :          {sqlName : "blob"},
    DATE :          {sqlName : "date"},
    TIME :          {sqlName : "time"},
    TIMESTAMP :     {sqlName : "timestamp"},
    YEAR :          {sqlName : "year"},
    DATE_TIME :     {sqlName : "datetime"},
    BOOL :          {sqlName : "bool"},
    BOOLEAN :       {sqlName : "boolean"},
    CHAR :          {sqlName : "char"},
    NUMBER :        {sqlName : "number"},
    INT :           {sqlName : "int"},
    TINYINT :       {sqlName : "tinyint"},
    SMALLINT :      {sqlName : "smallint"},
    MEDIUMINT :     {sqlName : "mediumint"},
    INTEGER :       {sqlName : "Integer"},
    BIGINT :        {sqlName : "bigint"},
    SERIAL :        {sqlName : "serial"},
    FLOAT :         {sqlName : "float"},
    DOUBLE :        {sqlName : "double"}

}

mysql.prototype.exec = function(callback) {
    this.end();
    this.db.connect();
    return this.db.query(this.sql, callback);
};

exports.getColumnDefaults = function(type){
    var columnDefaults = {
        type : String,
        allowNull : true,
        autoIncrement : false,
        primaryKey : false,
        foreignKey : false,
        association : null,
        "default" : null,
        length : 250,
        format  : null,
        description : ""
    };
    if(type == Date){
        delete columnDefaults.length;
        columnDefaults
    }

};
