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
for(var i in conditionedJoinTypes){
   joinMethods[i] = conditionedJoinTypes[i];
}
for(var i in unConditionedJoinTypes){
   joinMethods[i] = unConditionedJoinTypes[i];
}


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

var addFunction = function(oper, object, callback) {
    object[oper] = function(options) {
        return callback.apply(object, [oper, options])
    }
};

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
});

mysql.prototype._from = function(sql)
{
    if (this._isWhere) throw new Error("where clause already initiated.")
    if (!this._isFrom && !this._isWhere) {
        this.sql += " from " + this.table;
        this._isFrom = true;
    }
    return this;
};

mysql.prototype._createSQLFromObject = function(key, val) {
    var params = [], count = 0;
    if (typeof val === "object") {
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
        this.sql += " " + logicalOperator[oper] + " ";
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
    if (!this._isWhere) {
    if (!this.sql) this.find();
        if(!this._isFrom) this._from();
        if (typeof table == "string") {
            if (oper in conditionedJoinTypes) {
                if(options)
                {
                    var joinType = conditionedJoinTypes[oper];
                    this.sql += " " + joinType + " " + table;
                    if (options instanceof Array) {
                        this.sql += " using (" + options.join(", ") + ")";
                    } else if(typeof options == "object"){
                        this.sql += " on ";
                        for(var i in options){
                             this.sql += this.table + "." + i + "=" + table + "." + options[i]
                        }
                    }else{
                        throw new Error("join options must be an array or object")
                    }
                } else {
                    throw new Error(oper + " requires a join condition")
                }
            }else if(oper in unConditionedJoinTypes){
                var joinType = unConditionedJoinTypes[oper];
                    this.sql += " " + joinType + " " + table;
            }
        }
    } else {
        throw new Error("join must be before where clause")
    }
    return this;
};

mysql.prototype._booleanOp = function(oper, options) {
    if (!this.sql) this.find();
    if (!this._isWhere) this.where();
    oper = booleanOperator[oper];
    var params = [];
    for (var i in options) {
        if (this._needLogic) {
            this.and();
        }
        this.sql += this.format(i + " " + oper + " ?", [options[i]]);
        this._needLogic = true;
    }
    return this;
};

mysql.prototype._isOp = function(oper, options) {
    if (!this.sql) this.find();
    if (!this._isWhere) this.where();
    oper = isOperator[oper];
    var sql = "";
    if (typeof options == "object") {
        for (var i in options) {
            if (this._needLogic) {
                this.and();
            }
            this.sql += i + " " + oper + " " + transformBooleanOperator(options[i]);
            this._needLogic = true;
        }
    } else {
        if (this._needLogic) {
            this.and();
        }
        this.sql += options + " " + oper;
        this._needLogic = true;
    }
    return this;
};

mysql.prototype.where = function(options) {
    if (!this.sql) this.find();
    if(!this._isFrom) this._from();
    if (!this._needLogic) {
        if (!this._isWhere) {
            this._isWhere = true;
            this.sql += " where "
        }
        if (options) {
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
        }
    } else {
        throw new Error("where clause has already been created");
    }
    return this;
};
mysql.prototype.select = function(values, options) {
    if (this.sql) throw new Error("SQL statement already started, slect must be first operation called");
    this.sql = "select ";
    if (values) {
        for (var i in values) {
            var val = values[i];
            if (typeof val == "string") {
                if (i > 0) this.sql += ", ";
                this.sql += val;
            } else {
                throw new Error("select params must be a string")
            }
        }
    }
    if (options){ this.where(options);}
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
    this.sql = "select *"
    if (options) {
        this.where(options);
    }
    return this
};


mysql["in"] = function(options) {
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
    if(!this._isFrom) this._from();
    if (options) {
        if (!this._ordered) {
            this.sql += " order by ";
            this._orderedCount = 0;
            this._ordered = true;
        } else if (this._orderedCount) {
            this.sql += ", ";
        }
        if (typeof options == "string") {
            this.sql += options;
        } else if (options instanceof Array) {
            options.forEach(this.order, this);
        } else if (typeof options == "object") {
            var count = 0;
            for (var i in options) {
                if (count) throw new Error("when providing an object to order only one key is allowed");
                var type = options[i];
                if (type == 'desc' || type == "asc") {
                    this.sql += i + " " + type;
                } else {
                    throw new Error("Only 'asc' or 'desc' is allowed as a value for an ordered object")
                }
            }
        }
        this._orderedCount++;
    }
    return this;
};
mysql.prototype.orderBy = function(options) {
    return this.order(options);
};

/*
*   mysql.join(<tablename>, options);
*   select * from natural join <thisTable
* */
mysql.prototype.join = function(table, options) {
    return this._joinOp("innerJoin", table, options);

};
mysql.prototype.grep = function(options) {
};
mysql.prototype.like = function(options) {
};
mysql.prototype.group = function(options) {
    if (!this.sql) this.find();
    if (options) {
        if (!this._isWhere) this.where();
        this.sql += "(";
        this.where(options);
        this.sql += ")";
    }
    return this;
};
mysql.prototype.count = function(options) {
};
mysql.prototype.groupAndCount = function(options) {
};
mysql.prototype.having = function(options) {
};
mysql.prototype.and = function(options) {
    return this._logicalOp("and", options);
};
mysql.prototype.or = function(options) {
    return this._logicalOp("or", options);
};

//call this to finish off select clause and not execute
//else just call execute();
//i.e you just call mysql.find() or mysql.select(params);
//mysql.find.end(); mysql.find.select().end();
mysql.prototype.end = function(){
    if(!this._isFrom) this._from();
    return this;
}
