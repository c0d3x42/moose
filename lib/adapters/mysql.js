/*
 MYSQL query adapter to convert a query into mysql syntax;
 * */

var CONDITIONED_JOIN_TYPES = ["inner", "full_outer", "right_outer", "left_outer", "full", "right", "left"];

/* These symbols have _join methods created (e.g. natural_join) that
 call join_table with the symbol.  They only accept a single table
 argument which is passed to join_table, and they raise an error
 if called with a block. */
var UNCONDITIONED_JOIN_TYPES = ["natural", "natural_left", "natural_right", "natural_full", "cross"];


exports.mysql = (mysql = {});
// All methods that return modified datasets with a joined table added.
mysql.JOIN_METHODS = [].concat(CONDITIONED_JOIN_TYPES, UNCONDITIONED_JOIN_TYPES);

var booleanOperator = {
    "gt" : ">",
    "gte" : ">=",
    "lt" : "<",
    "lte" : "<="
};

var logicalOperator = {
    "and" : "and",
    "or" : "or"
};

var createSQLFromObject = function(key, val, db) {
    console.log("IN CREATE")
    var sql = "";
    var params = [], count = 0;
    console.log(key);
    console.log(val);
    if (typeof val === "object") {
        for (var j in val) {
            if (j in mysql) {
                var opts = {};
                opts[key] = val[j];
                sql += mysql[j](opts, db);
            } else {
                throw new Error("Operation " + j + "is not supported");
            }
        }
    }
    return sql;
}

var booleanOp = function(oper, options, db) {
    oper = booleanOperator[oper];
    var sql = "";
    var params = [];
    for (var i in options) {
        if(sql) { sql += " AND "};
        var param = options[i]
        if (typeof param == "object") {
            throw new Error(oper + " does not support " + typeof param + "as an value");
        }
        sql += i + " " + oper + " ?"
        params.push(param)
    }
    return db.format(sql, params);
};

var logicalOp = function(oper, options, db) {
    oper = logicalOperator[oper];
    var sql = logicalOperator[oper] + " ";
    var params = [];
    var count = 0;
    console.log("IN LOGIC")
    console.log(options)
    console.log(oper)
    for (var i in options) {
        if (count) throw new Error(oper + "operation can only be one deep");
        sql += createSQLFromObject(i, options[i], db);
        count++;
    }
    return sql;
};

mysql.where = function(options, db) {
};
mysql.select = function(options, db) {
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
mysql.find = function(options, table, db) {
    var sql = "select * from " + table + " where ";
    var params = [], count = 0;
    for (var i in options) {
        if (count) {
            opts = {};
            opts[i] = options[i];
            sql += " " + mysql.and(opts, db);
        } else {
            sql += createSQLFromObject(i, options[i], db);
        }
        count++;
    }
    return sql;
};

mysql.gt = function(options, db) {
    return booleanOp("gt", options, db);
};
mysql.gte = function(options, db) {
    return booleanOp("gte", options, db);
};
mysql.lt = function(options, db) {
    return booleanOp("lt", options, db);
};
mysql.lte = function(options, db) {
    return booleanOp("lte", options, db);
};
mysql["in"] = function(options, db) {
};
mysql.ne = function(options, db) {
};
mysql.is = function(options, db) {
};
mysql.isNot = function(options, db) {
};
mysql.isNull = function(options, db) {
};
mysql.isNotNull = function(options, db) {
};
mysql.between = function(options, db) {
};
mysql.notBetween = function(options, db) {
};
mysql.order = function(options, db) {
};
mysql.orderBy = function(options, db) {
};
mysql.join = function(options, db) {
};
mysql.grep = function(options, db) {
};
mysql.like = function(options, db) {
};
mysql.group = function(options, db) {
};
mysql.count = function(options, db) {
};
mysql.groupAndCount = function(options, db) {
};
mysql.having = function(options, db) {
};
mysql.and = function(options, db) {
    return logicalOp("and", options, db);
};
mysql.or = function(options, db) {
    return logicalOp("and", options, db);
};
