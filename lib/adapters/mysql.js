/*
 MYSQL query adapter to convert a query into mysql syntax;
 * */

var CONDITIONED_JOIN_TYPES = ["inner", "full_outer", "right_outer", "left_outer", "full", "right", "left"];

/* These symbols have _join methods created (e.g. natural_join) that
 call join_table with the symbol.  They only accept a single table
 argument which is passed to join_table, and they raise an error
 if called with a block. */
var UNCONDITIONED_JOIN_TYPES = ["natural", "natural_left", "natural_right", "natural_full", "cross"];

// All methods that return modified datasets with a joined table added.
var JOIN_METHODS = [].concat(CONDITIONED_JOIN_TYPES, UNCONDITIONED_JOIN_TYPES);


var booleanOperator = {
    "gt" : ">",
    "gte" : ">=",
    "lt" : "<",
    "lte" : "<=",
    "eq" : "=",
    "ne" : "!="
};

var logicalOperator = {
    "and" : "and",
    "or" : "or"
};

exports.mysql = (mysql = function(table, db) {
    this.sql = "";
    this._needLogic = false;
    this._isWhere = false;
    this.table = table;
    this.db = db;
    this.format = function(sql, params) {
        return db.format(sql, params)
    }
});

mysql.prototype._createSQLFromObject = function(key, val) {
    var params = [], count = 0;
    if (typeof val === "object") {
        for (var j in val) {
            if (j in this) {
                var opts = {};
                opts[key] = val[j];
                this[j](opts);
            } else {
                throw new Error("Operation " + j + "is not supported");
            }
        }
    } else {
        //assume its equals
        var opts = {};
        opts[key] = {eq : val};
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
    }else{
        throw new Error("logical operator not needed");
    }
    return this;
};


mysql.prototype._booleanOp = function(oper, options) {
    if (!this.sql) this.find();
    if (!this._isWhere) this.where();
    oper = booleanOperator[oper];
    var sql = "";
    var params = [];
    for (var i in options) {
        if (this._needLogic) {
            this.and();
        }
        sql += i + " " + oper + " ?"
        params.push(options[i])
        this._needLogic = true;
    }
    this.sql += this.format(sql, params);
    return this;
};

mysql.prototype.where = function(options) {
    if (!this.sql) this.find();
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
mysql.prototype.select = function(options) {
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
    this.sql = "select * from " + this.table;
    if (options) this.where(options);
    return this
};

mysql.prototype.gt = function(options) {
    return this._booleanOp("gt", options);
};
mysql.prototype.gte = function(options) {
    return this._booleanOp("gte", options);
};
mysql.prototype.lt = function(options) {
    return this._booleanOp("lt", options);
};
mysql.prototype.lte = function(options) {
    return this._booleanOp("lte", options);
};
mysql["in"] = function(options) {
};
mysql.prototype.eq = function(options) {
    return this._booleanOp("eq", options);
};
mysql.prototype.ne = function(options) {
    return this._booleanOp("ne", options);
};
mysql.prototype.is = function(options) {

};
mysql.prototype.isNot = function(options) {
};
mysql.prototype.isNull = function(options) {
};
mysql.prototype.isNotNull = function(options) {
};
mysql.prototype.between = function(options) {
};
mysql.prototype.notBetween = function(options) {
};
mysql.prototype.order = function(options) {
};
mysql.prototype.orderBy = function(options) {
};
mysql.prototype.join = function(options) {
};
mysql.prototype.grep = function(options) {
};
mysql.prototype.like = function(options) {
};
mysql.prototype.group = function(options) {
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
