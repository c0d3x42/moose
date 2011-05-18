var comb = require("comb"),
        Promise = comb.Promise,
        PromiseList = comb.PromiseList,
        hitch = comb.hitch;

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

/**
 * @class Base class for all SQL database query types.
 * This class is an abstract class for all SQL adapter implementations.
 *
 * An instance of SQL provides methods for querying, updating and removing a datase
 * @name SQL
 * @property {String} sql the current sql query string.
 */
module.exports = exports = comb.define(null, {
    instance : {
        /**@lends SQL.prototype*/

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
        },

        /**
         * Clear the current query.
         */
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

        /**
         * Formats and escapes query string.
         *
         * @function
         * @param {String} sql the sql to format
         * @param {Array} array of values to place in the query.
         *
         * @return {String} the formatted string.
         */
        format : format,

        _from : function(sql) {
            var sqlObject = this.sqlObject;
            if (!sqlObject.from) {
                sqlObject.from = "from " + this.table;
            }
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

        /**
         * Set the where clause of the query.
         * This is different fron find in that it can be used with updates, and deletions.
         *
         * @example
         * QUERYING
         *
         * var sql = new SQL("test", db);
         *
         * //select * from test where id = 1
         * sql.where({id : 1});
         * //select * from test where id in (1,2,3,4,5)
         * sql.where({id : [1,2,3,4,5]});
         * //select * from test where x != 0
         * sql.where({x : {neq : 0}});
         * //select distinct * from test where id = 1
         * sql.where({id : 1}).distinct();
         * //select * from test where a >= 'b' limit 1
         * sql.where({a : {gte : "b"}}).limit(1);
         * //select * from test where flag is unknown
         * sql.where({flag : {is : "unknown"}});
         * //select * from test where flag is not unknown
         * sql.where({flag : {isNot : "unknown"}});
         * //select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null
         * sql.where({flag : {is : false}, flag2 : {isNot : "unknown"}, anotherFlag : {isNull : true}, yetAnotherFlag : {isNotNull : true}});
         * //select * from test where firstName like 'bob' and lastName not like 'henry'
         * sql.where({firstName : {like : 'bob'}, lastName : {notLike : "henry"}});
         * //select * from test where firstName like 'bob' and lastName not like 'henry'
         * sql.where({firstName : {like : 'bob'}, lastName : {notLike : "henry"}});
         *
         * @example
         * UPDATES
         *
         * //update test set x=1 where x >= 1 and x <= 5
         * sql.update({x : 1}).where({x : {between : [1,5]}});
         *
         * @example
         * DELETIONS
         *
         * //delete from test where x >= 1 and x <= 5
         * sql.remove().where({x : {between : [1,5]}});
         *
         * @param {Object} options See {@link SQL#find}
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        where : function(options) {
            throw new Error("Not Implemented!");
        },

        /**
         * Use to return particular columns from a query, i.e. select clause in sql.
         *
         * @example
         * var sql = new SQL("test", db);
         *
         * //select a, b, c from testTable;
         * sql.select(["a", "b", "c"]);
         * //select a from testTable;
         * sql.select("a");
         * //select a from test where x = 1 and y >=1 and y <= 10
         * sql.select("a", {x : 1, y : {between : [1,10]}});
         *
         * @param {String|Array} columns the columns to select
         * @param {Object} options query {@link SQL#find}
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        select : function(values, options) {
            throw new Error("Not Implemented!");
        },

        /**
         * Select on dinstict results, same is distinct clause in SQL statment.
         *
         * @example
         * //select distinct * from test where id = 1
         * sql.find({id : 1}).distinct();
         * //select distinct test.* from test inner join test2 on test.id=test2.id where test2.other = 1
         * sql.join("test2", {id : "id"}).where({"test2.other" : 1}).select("test.*").distinct();
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        distinct : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Signify this SQL instance as an update statement.
         *
         * <p><b>Cannot be used in combination with remove, or find queries.</b></p>
         *
         * @example
         * //update test set x=1
         * sql.update({x : 1});
         * //update test set x=1 where x >= 1 and x <= 5
         * sql.update({x : 1}, {x : {between : [1,5]}});
         * //update test set x=1 where x >= 1 and x <= 5
         * sql.update({x : 1}).where({x : {between : [1,5]}});
         * //update test set x=1 where x >= 1 and x <= 5
         * sql.update({x : 1}).find({x : {between : [1,5]}});
         * //update test inner join test2 on test.flag=test2.false set x=1
         * sql.update({x : 1}).join("test2", {flag : false});
         * @param {Object} values key value pairs of columns, and values to update.
         * @param {Object} [query] optional query to allow limiting of rows to update {@link SQL#where}
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        update : function(values, options) {
            throw new Error("Not Implemented!");
        },

        /**
         *  Signify this SQL instance as a delete statement
         *
         *  <p><b>Cannot be used in combination with update, or find queries.</b></p>
         *
         * @example
         * //delete from test
         * sql.remove();
         * //delete from test where x >= 1 and x <= 5
         * sql.remove(null, {x : {between : [1,5]}});
         * //delete from test where x >= 1 and x <= 5
         * sql.remove().where({x : {between : [1,5]}});
         * //delete from test where x >= 1 and x <= 5
         * sql.remove().find({x : {between : [1,5]}});
         * //delete test from test inner join test2 on test.flag=test2.false
         * sql.remove().join("test2", {flag : false});
         * //delete test, test2 from test inner join test2 on test.flag=test2.false
         * sql.remove("test2").join("test2", {flag : false});
         *
         * @param {String|Array} [tables=null] Should only be used to specify the removal of items from multiple tables.
         * @param {Object} [query] Use to limit the rows deleted {@link SQL#where}
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        remove : function(values, options) {
            throw new Error("Not Implemented!");
        },

        /**
         * This is a wrapper to enable using an object to query a dataset.
         * The hash can contain the name of any querying function as a key,
         * and the value to look for as the value. When using find it signifies
         * this SQL instance as a query.
         *
         *  <p><b>Cannot be used in combination with update, or remove queries.</b></p>
         *
         * @example
         *  {nameOfColumn : {queryOp : value}};
         * @example
         *  var sql = new SQL("test", db);
         *
         * //select * from test
         * sql.find();
         * //select * from test where id = 1;
         * sql.find({id : 1});
         * //select * from test where x != 0
         * sql.find({x : {neq : 0}});
         * //select * from test where id in (1,2,3,4,5)
         * sql.find({id : [1,2,3,4,5]});
         *  //select distinct * from test where id = 1
         * sql.find({id : 1}).distinct();
         * //select * from test where a >= 'b' limit 1
         * sql.find({a : {gte : "b"}}).limit(1);
         * //select * from test where flag is unknown
         * sql.find({flag : {is : "unknown"}});
         * //select * from test where flag is not unknown
         * sql.find({flag : {isNot : "unknown"}});
         * //select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null
         * sql.find({flag : {is : false}, flag2 : {isNot : "unknown"}, anotherFlag : {isNull : true}, yetAnotherFlag : {isNotNull : true}});
         * //select * from test where firstName like 'bob' and lastName not like 'henry'
         * sql.find({firstName : {like : 'bob'}, lastName : {notLike : "henry"}});
         * //select * from test where firstName like 'bob' and lastName not like 'henry'
         * sql.find({firstName : {like : 'bob'}, lastName : {notLike : "henry"}});
         *
         * @param {Object} [query] query to limit result set.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        find : function(options) {
            throw new Error("Not Implemented!");
        },

        /**
         * To be used with queries to specify an order of the result set.
         *
         * @example
         * //select * from test order by x
         * sql.order("x");
         * //select * from test order by x desc
         * sql.order({x : "desc"});
         * //select * from test order by x, y
         * sql.order(["x", "y"]);
         * //select * from test order by x, y desc
         * sql.order(["x", {y : "desc"}]);
         * //select * from test order by x desc, y desc
         * sql.order([{x : "desc"},{y : "desc"}]);
         * //select * from test order by x, y, z desc
         * sql.order("x").order("y").order({z : "desc"});
         *
         * @param {String|Array|Object} options see example for uses of each.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        order : function(options) {
            throw new Error("Not Implemented!");
        },

        /**
         * {@link SQL#order}
         * @param options
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        orderBy : function(options) {
            return this.order(options);
        },

        /**
         * Clears the order clause
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        clearOrder : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.order;
            return this;
        },

        /**
         * Use to limit the number of results returned.
         *
         * @example
         * //select * from test limit 1
         * sql.limit(1);
         * //select * from test limit 1 offset 10
         * sql.limit(1, 10);
         * //select * from test where a >= 'b' limit 1
         * sql.find({a : {gte : "b"}}).limit(1);
         *
         * @param {Number} limit the limit to specify on the query
         * @param {Number} [offset] {@link SQL#offset}
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        limit : function(limit, offset) {
            throw new Error("Not Implemented!");
        },

        /**
         * Clear the limit clause on this SQL query
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        clearLimit : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.limit;
            return this;
        },

        /**
         * Specify an offset, offset says to skip that many rows
         * before beginning to return rows to the client. If both
         * offset and limit are used, then offset rows are skipped
         * before starting to count the limit rows that are returned
         *
         * @example
         * //select * from test where a >= 'b' offset 10
         * sql.find({a : {gte : "b"}}).offset(10);
         * @param {Number} offset the number to offset the result set by.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        offset : function(offset) {
            throw new Error("Not Implemented!");
        },

        /**
         * Removes the offset clause from a query.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        clearOffset : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.offset;
            return this;
        },

        /**
         * Perform a group operation.
         *
         * @example
         * //select * from test group by name
         * sql.group("name");
         * //select * from test group by name, age
         * sql.group(["name", "age"]);
         * //select * from test group by name having name = 'bob'
         * sql.group("name", {name : "bob"});
         * //select * from test group by name, age having age >= 10 and age <= 20
         * sql.group(["name", "age"], {age : {between : [10, 20]}});
         *
         * @param {String|Array} key specify the columns to group on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        group : function(key, options) {
            throw new Error("Not Implemented!");
        },

        /**
         * Add a having clause, this is only valid on queries that contain a group clause.
         *
         * Once a having clause has been added all query operations will be added to the having clause.
         *
         * @example
         * //select * from test group by name, age having age >= 10 and age <= 20
         * sql.group(["name", "age"]).having({age : {between : [10, 20]}});
         * //select * from test group by name, age having age >= 10 and age <= 20
         * sql.group(["name", "age"]).having().find({age : {between : [10, 20]}});
         * //select * from test group by name, age having age is null
         * sql.group(["name", "age"]).having().isNull("age");
         *
         * @param {Object} [options] the query use on the having clause, same syntax as {@link SQL#find}, {@link SQL#where};
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        having : function(options) {
            throw new Error("Not Implemented!");
        },

        /**
         * Clear the having clause from the query.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        clearHaving : function() {
            var sqlObject = this.sqlObject;
            delete sqlObject.having;
            return this;
        },

        /**
         * Add a logic group to a query. The query that is passed in will be wrapped in parens.
         *
         * @example
         * //select * from test where (flag is not null and x = 1) or (x = 2)
         * sql.logicGroup({flag : {isNot : null}, x : 1}).or().logicGroup({x : 2});
         *
         * @param {Object} query query to group as one logical group;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        logicGroup : function(options) {
            throw new Error("Not Implemented!");
        },

        /**
         * Specify an is clause.
         *
         * @example
         * //select * from test where flag is true
         * sql.is({flag : true});
         * //select * from test where flag is false
         * sql.is({flag : false});
         * //select * from test where flag is null
         * sql.is({flag : null});
         * //select * from test where flag is unknown
         * sql.is({flag : "unknown"});
         * //select * from test where flag is true and otherFlag is false and anotherFlag is unknown and yetAnotherFlag is null
         * sql.is({flag : true, otherFlag : false, anotherFlag : "unknown", yetAnotherFlag : null});
         * //select * from test where flag is unknown
         * sql.find({flag : {is : "unknown"}});
         * //select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null
         * sql.is({flag : false}).isNot({flag : "unknown"}).isNull("anotherFlag").isNotNull("yetAnotherFlag
         * //select * from test where flag is not null and flag is true or flag is false
         * sql.isNotNull("flag").is({flag : true}).or({flag : {is : false}});
         *
         * @param {Object} options key value pairs to add is clauses for.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        is: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add is not clause
         *
         * @example
         *
         * //select * from test where flag is not true
         * sql.isNot({flag : true});
         * //select * from test where flag is not false
         * sql.isNot({flag : false});
         *  //select * from test where flag is not null
         * sql.isNot({flag : null});
         * //select * from test where flag is not unknown
         * sql.isNot({flag : "unknown"});
         * //select * from test where flag is not true and otherFlag is not false and anotherFlag is not unknown and yetAnotherFlag is not null
         * sql.isNot({flag : true, otherFlag : false, anotherFlag : "unknown", yetAnotherFlag : null});
         * //select * from test where flag is not unknown
         * sql.find({flag : {isNot : "unknown"}});
         * //select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null
         * sql.is({flag : false}).isNot({flag : "unknown"}).isNull("anotherFlag").isNotNull("yetAnotherFlag");
         * sql.find({flag : {is : false}, flag2 : {isNot : "unknown"}, anotherFlag : {isNull : true}, yetAnotherFlag : {isNotNull : true}});
         * //select * from test where flag is not null and flag is true or flag is false
         * sql.isNotNull("flag").is({flag : true}).or({flag : {is : false}});
         *
         * @param {Object} options key value pairs to add is not clauses for.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        isNot: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add is null check
         *
         * @example
         *  //select * from test where flag is null
         * sql.isNull("flag");
         * //select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null
         * sql.is({flag : false}).isNot({flag : "unknown"}).isNull("anotherFlag").isNotNull("yetAnotherFlag
         * //select * from test where flag is not null and flag is true or flag is false
         * sql.isNotNull("flag").is({flag : true}).or({flag : {is : false}});
         *
         * @param {String} options column to check is not null.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        isNull: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Check if a column is not null.
         *
         * @example
         * //select * from test where flag is not null
         * sql.isNotNull("flag");
         * //select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null
         * sql.is({flag : false}).isNot({flag : "unknown"}).isNull("anotherFlag").isNotNull("yetAnotherFlag
         * //select * from test where flag is not null and flag is true or flag is false
         * sql.isNotNull("flag").is({flag : true}).or({flag : {is : false}});
         *
         * @param {String} options name of column to check.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        isNotNull: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add and operator, one does not need to call this but it is provided for clarity.
         *
         * @example
         * //select * from test where x <= 1 and y >= 1
         * sql.lte({x : 1}).gte({y : 1});
         * sql.lte({x : 1}).and({y : { gte : 1}});
         * sql.lte({x : 1}).and().gte({y : 1});
         *
         * @param {Object} [options] query to append after the and.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        and: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Use to add an or clause
         * @example
         * //select * from test where x <= 1 and y >= 1
         *  sql.lte({x : 1}).or({y : {gte : 1}});
         *  sql.lte({x : 1}).or().gte({y : 1});
         * @param {Object} query added after the or clause
         */
        or: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Use to find rows that are greater than a particular value
         *
         * @example
         * //select * from test where x > 0
         *sql.gt({x : 0});
         *sql.find({x : {gt : 0}});
         * @param {Object} options keys values to add greater than checks for.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        gt: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a check for a value greater than or equal to a particular value.
         *
         * @example
         * //select * from test where x >= 0
         * sql.gte({x : 0});
         * sql.find({x : {gte : 0}});
         *
         * @param {Object} options key values to add greater than or equal to checks.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        gte: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a check for a value less than a particular value.
         *
         * @example
         * //select * from test where x < 1
         * sql.lt({x : 1});
         * sql.find({x : {lt : 1}});
         * @param {Object} options key values to add less than checks.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        lt: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a check for a value less than or equal to a particular value.
         *
         * @example
         * //select * from test where x <= 1
         * sql.lte({x : 1});
         * sql.find({x : {lte : 1}});
         * @param {Object} options key values to add less than or equal to checks.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        lte: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Use to find rows that equal a particular value
         *
         * @example
         * //select * from test where x = 0");
         * sql.eq({x : 0});
         * sql.find({x : 0});
         * @param {Object} options object with key\<column\> and value\<value it should equal\>
         *
         *  @return {SQL} this to allow chaining of query elements.
         */
        eq: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Use to find rows that have a column that do not equal a particular value.
         *
         * @example
         * //select * from test where x != 0;
         * sql.neq({x : 0});
         * sql.find({x : {neq : 0}});
         *
         * @param {Object} options key value pairs to find columns no equal to a value
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        neq: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * This is an alias for an inner join.
         *
         * @example
         *
         * //select * from test inner join test2 on test.id=test2.id
         *  sql.join("test2", {id : "id"});
         * //select * from test inner join test2 using (id, name)
         *  sql.join("test2", ["id", "name"]);
         *  //select * from test inner join test2 on test.id=test2.id left join test3 using (name)
         * sql.join("test2", {id : "id"}).leftJoin("test3", ["name"]);
         * //select * from test inner join test2 using (id, name) natural join test3
         * sql.join("test2", ["id", "name"]).naturalJoin("test3
         * //select * from test inner join test2 on test.id=test2.id left join test3 using (name) where x = 2 or x = 3
         * sql.join("test2", {id : "id"}).leftJoin("test3", ["name"]).eq({x : 2}).or({x : 3});
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        join : function(table, options) {
            throw new Error("Not Implemented!");
        },

        /**
         * Add an inner join to another table
         *
         * @example
         * //select * from test inner join test2 on test.id=test2.id
         * sql.innerJoin("test2", {id : "id"});
         * //select * from test inner join test2 using (id, name)
         * sql.innerJoin("test2", ["id", "name"]);
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        innerJoin: function(tableName, options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a full outer join to another table
         *
         * @example
         * //select * from test full outer join test2 on test.id=test2.id
         * sql.fullOuterJoin("test2", {id : "id"});
         * //select * from test full outer join test2 using (id, name)
         * sql.fullOuterJoin("test2", ["id", "name"]);
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        fullOuterJoin: function(tableName, options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a right outer join to another table
         *
         * @example
         * sql.rightOuterJoin("test2", {id : "id"});
         * //select * from test right outer join test2 on test.id=test2.id
         * sql.rightOuterJoin("test2", ["id", "name"]);
         * //select * from test right outer join test2 using (id, name);
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        rightOuterJoin: function(tableName, options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a left outer join to another table
         *
         * @example
         * //select * from test left outer join test2 on test.id=test2.id
         * sql.leftOuterJoin("test2", {id : "id"});
         * //select * from test left outer join test2 using (id, name)
         * sql.leftOuterJoin("test2", ["id", "name"]);
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        leftOuterJoin: function(tableName, options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a full join to another table
         *
         * @example
         * //select * from test full join test2 on test.id=test2.id
         * sql.fullJoin("test2", {id : "id"});
         * //select * from test full join test2 using (id, name)
         * sql.fullJoin("test2", ["id", "name"]);
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        fullJoin: function(tableName, options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a right join to another table
         *
         * @example
         * //select * from test right join test2 on test.id=test2.id
         * sql.rightJoin("test2", {id : "id"});
         * //select * from test right join test2 using (id, name)
         * sql.rightJoin("test2", ["id", "name"]);
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        rightJoin: function(tableName, options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a left join to another table
         *
         * @example
         * //select * from test left join test2 on test.id=test2.id
         * sql.leftJoin("test2", {id : "id"});
         * //select * from test left join test2 using (id, name)
         * sql.leftJoin("test2", ["id", "name"]);
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         * @param {Array|Object} options When an array is passed in the a using clause is used
         *          to specify the columns to join on, of an object is passed in then it is the same as using an on clause;
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        leftJoin: function(tableName, options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a natural join to another table
         *
         * @example
         * //select * from test natural full join test2
         * sql.naturalFullJoin("test2");
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        naturalJoin: function(tableName) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a natural left join to another table
         *
         * @example
         * //select * from test natural left join test2
         * sql.naturalLeftJoin("test2");
         * //select * from test natural join test2
         * sql.naturalJoin("test2");
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        naturalLeftJoin: function(tableName) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a natural right join to another table
         *
         * @example
         * //select * from test natural right join test2
         * sql.naturalRightJoin("test2");
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        naturalRightJoin: function(tableName) {
            throw new Error("Not Implemented")
        },
        naturalFullJoin: function(tableName) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a cross join to another table
         *
         * @example
         * //select * from test cross join test2
         * sql.crossJoin("test2");
         *
         * @param {String|SQL} table the table or SQL clause that specifies the joining table.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        crossJoin: function(tableName) {
            throw new Error("Not Implemented")
        },

        /**
         * Add an in clause
         *
         * @example
         * //select * from test where id in (1,2,3,4,5)
         * sql.in({id : [1,2,3,4,5]});
         * sql.find({id : [1,2,3,4,5]});
         * //select * from test where id in (1,2,3,4,5) and id2 in (6,7,8,9,10)
         * sql.find({id : [1,2,3,4,5], id2 : [6,7,8,9,10]});
         * //select * from test where id in (1,2,3,4,5) and id2 not in (6,7,8,9,10)
         * sql.in({id : [1,2,3,4,5]}).notIn({id2 : [6,7,8,9,10]});
         * //select * from test where id in (1,2,3,4,5) and id2 in (6,7,8,9,10)
         * sql.in({id : [1,2,3,4,5], id2 : [6,7,8,9,10]});
         * //select * from test where id in (select id2 from test2 where name >= 'A' and name <= 'B')
         * sql.in({id : new Mysql("test2", db).select("id2").between({name : ["A", "B"]})});
         *
         * @param {Object} options key value pairs where the key is coulmn name and the value is an array of values.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        "in": function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a not in clause
         *
         * @example
         * //select * from test where id not in (1,2,3,4,5)
         * sql.notIn({id : [1,2,3,4,5]});
         * sql.find({id : {notIn : [1,2,3,4,5]}});
         * //select * from test where id not in (1,2,3,4,5) and id2 in (6,7,8,9,10)
         * sql.notIn({id : [1,2,3,4,5]}).in({id2 : [6,7,8,9,10]});
         * //select * from test where id not in (1,2,3,4,5) and id2 not in (6,7,8,9,10)
         * sql.notIn({id : [1,2,3,4,5], id2 : [6,7,8,9,10]});
         * //select * from test where id not in (select id2 from test2 where name >= 'A' and name <= 'B')
         * sql.notIn({id : new Mysql("test2", db).select("id2").between({name : ["A", "B"]})});
         * @param {Object} options options key value pairs where the key is coulmn name and the value is an array of values.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        notIn: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a between check for a column.
         *
         * @example
         * //select * from test where x >= 1 and x <= 5
         * sql.between({x : [1,5]});
         * //select * from test where x >= 'a' and x <= 'b'
         * sql.find({x : {between : ["a","b"]}});
         *
         * @param options options key value pairs where the
         * key is coulmn name and the value is an array of two
         * values, first value in the array represents the gte
         * value and the second value being the lte value.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        between: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a not between check for a column.
         * @example
         * //select * from test where x <= 1 and x >= 5
         * sql.notBetween({x : [1,5]});
         * //select * from test where x <= 'a' and x >= 'b'
         * sql.notBetween({x : ["a","b"]});
         * //select * from test where x <= 'a' and x >= 'b'
         * sql.find({x : {notBetween : ["a","b"]}});
         *
         * @param @param options options key value pairs where the
         * key is coulmn name and the value is an array of two
         * values, first value in the array represents the lte
         * value and the second value being the gte value.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        notBetween: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a count cause to the select portion of the query.
         *
         * @example
         * //select count(name) as name_count from test
         * sql.count("name");
         * //select count(*) as count from test
         * sql.count();

         * @param {String|Array} [options="*"] if a string is supplied
         * then a count is added for that particular columns, an array
         * adds a count for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        count: function(options) {
            throw new Error("Not Implemented")
        },


        /**
         * Helper to add a group and count clause.
         *
         * @example
         * //select *, count(name) as name_count from test group by name
         * sql.groupAndCount("name");
         * @param {String|Array} key specify the columns to group and count on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndCount: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and sum clause.
         *
         * @example
         * sql.groupAndSum("name");
         * //select *, sum(name) as name_sum from test group by name
         *
         * @param {String|Array} key specify the columns to group and sum on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndSum: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and avg clause.
         *
         *  @example
         * //select *, avg(name) as name_avg from test group by name
         * sql.groupAndAvg("name");
         *
         * @param {String|Array} key specify the columns to group and avg on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndAvg: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and min clause.
         *
         * @example
         * //select *, min(name) as name_min from test group by name
         * sql.groupAndMin("name");
         *
         * @param {String|Array} key specify the columns to group and min on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndMin: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and max clause.
         *
         * @example
         * //select *, max(name) as name_max from test group by name
         * sql.groupAndMax("name");
         *
         * @param {String|Array} key specify the columns to group and max on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndMax: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and bit and clause.
         *
         * @example
         * //select *, bit_and(name) as name_bit_and from test group by name
         * sql.groupAndBitAnd("name");
         *
         * @param {String|Array} key specify the columns to group and bit and on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndBitAnd: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and bit or clause.
         *
         * @example
         * //select *, bit_or(name) as name_bit_or from test group by name
         * sql.groupAndBitOr("name");
         *
         * @param {String|Array} key specify the columns to group and bit or on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndBitOr: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and bit xor clause.
         *
         * @example
         * //select *, bit_xor(name) as name_bit_xor from test group by name
         * sql.groupAndBitXor("name");
         *
         * @param {String|Array} key specify the columns to group and bit xor on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndBitXor: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and std clause.
         *
         * @example
         * //select *, std(name) as name_std from test group by name
         * sql.groupAndStd("name");
         *
         * @param {String|Array} key specify the columns to group and std on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndStd: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and std dev pop clause.
         *
         * @example
         * //select *, stddev_pop(name) as name_stddev_pop from test group by name
         * sql.groupAndStdDevPop("name");
         *
         * @param {String|Array} key specify the columns to group and std dev pop on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndStdDevPop: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and std dev samp clause.
         *
         * @example
         * //select *, stddev_samp(name) as name_stddev_samp from test group by name
         * sql.groupAndStdDevSamp("name");
         *
         * @param {String|Array} key specify the columns to group and std dev samp on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndStdDevSamp: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and std dev clause.
         *
         * @example
         * //select *, stddev(name) as name_stddev from test group by name
         * sql.groupAndStdDev("name");
         *
         * @param {String|Array} key specify the columns to group and std dev on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndStdDev: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and var pop clause.
         *
         * @example
         * //select *, var_pop(name) as name_var_pop from test group by name
         * sql.groupAndVarPop("name");
         *
         * @param {String|Array} key specify the columns to group and var pop on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndVarPop: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and var samp clause.
         *
         * @example
         * //select *, var_samp(name) as name_var_samp from test group by name
         * sql.groupAndVarSamp("name");
         *
         * @param {String|Array} key specify the columns to group and var samp on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndVarSamp: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a group and variance clause.
         *
         * @example
         * //select *, variance(name) as name_variance from test group by name
         * sql.groupAndVariance("name");
         *
         * @param {String|Array} key specify the columns to group and variance on.
         * @param {Object} having specify a having clause {@link SQL#having}.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        groupAndVariance: function() {
            throw new Error("Not Implemented");
        },

        /**
         * Helper to add a sum clause.
         *
         * @example
         * //select sum(name) as name_sum from test
         * sql.sum("name");
         *
         * @param {String|Array} [options="*"] if a string is supplied
         * then a sum is added for that particular columns, an array
         * adds a sum for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        sum: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * @example
         * //select avg(name) as name_avg from test
         * sql.avg("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a avg is added for that particular columns, an array
         * adds a avg for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        avg: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a min clause.
         *
         * @example
         * //select min(name) as name_min from test
         * sql.min("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a min is added for that particular columns, an array
         * adds a min for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        min: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a max clause.
         *
         * @example
         * //select max(name) as name_max from test
         * sql.max("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a max is added for that particular columns, an array
         * adds a max for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        max: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a bit and clause.
         *
         * @example
         * //select bit_and(name) as name_bit_and from test
         * sql.bitAnd("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a bit and is added for that particular columns, an array
         * adds a bit and for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        bitAnd: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * @example
         * //select bit_or(name) as name_bit_or from test
         * sql.bitOr("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a bit or is added for that particular columns, an array
         * adds a count for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        bitOr: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a bit xor clause.
         *
         * @example
         * //select bit_xor(name) as name_bit_xor from test
         * sql.bitXor("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a bit xor is added for that particular columns, an array
         * adds a bit xor for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        bitXor: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a std clause.
         *
         * @example
         * //select std(name) as name_std from test
         * sql.std("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a std is added for that particular columns, an array
         * adds a std for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        std: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a std dev clause.
         *
         * @example
         * //select stddev_pop(name) as name_stddev_pop from test
         * sql.stdDevPop("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a std dev pop is added for that particular columns, an array
         * adds a std dev pop for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        stdDevPop: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a std dev samp clause.
         *
         * @example
         * //select stddev_samp(name) as name_stddev_samp from test
         * sql.stdDevSamp("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a std dev samp is added for that particular columns, an array
         * adds a std dev samp for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        stdDevSamp: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a std dev clause.
         *
         * @example
         * //select stddev(name) as name_stddev from test
         * sql.stdDev("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a std dev is added for that particular columns, an array
         * adds a std dev for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        stdDev: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a var pop clause.
         *
         * @example
         * //select var_pop(name) as name_var_pop from test
         * sql.varPop("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a var pop is added for that particular columns, an array
         * adds a var pop for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        varPop: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a var samp clause.
         *
         * @example
         * //select var_samp(name) as name_var_samp from test
         * sql.varSamp("name");
         * @param options
         *
         * @param {String|Array} [options="*"] if a string is supplied
         * then a var samp is added for that particular columns, an array
         * adds a var samp for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        varSamp: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Helper to add a variance clause.
         *
         * @example
         * //select variance(name) as name_variance from test
         * sql.variance("name");
         * @param {String|Array} [options="*"] if a string is supplied
         * then a variance is added for that particular columns, an array
         * adds a variance for each column in the array.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        variance: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         * Add a like clause.
         *
         * @example
         * //select * from test where name like 'bob'
         * sql.like({name : "bob"});
         * //select * from test where firstName like 'bob' and lastName not like 'henry'
         * sql.find({firstName : {like : 'bob'}, lastName : {notLike : "henry"}});
         *
         * @param {Object} options key, value pairs with the key representing a column,
         * and the key represents the like condition.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        like: function(options) {
            throw new Error("Not Implemented")
        },

        /**
         *  Add a not like clause.
         *
         * @example
         * //select * from test where name not like 'bob'
         * sql.notLike({name : "bob"});
         * //select * from test where firstName like 'bob' and lastName not like 'henry'
         * sql.find({firstName : {like : 'bob'}, lastName : {notLike : "henry"}});
         *
         * @param {Object} options key, value pairs with the key representing a column,
         * and the key represents the not like condition.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        notLike: function(options) {
            throw new Error("Not Implemented")
        },


        /**
         * Performs clean up to add any needed protions of a query if not provided.
         *
         * @return {SQL} this to allow chaining of query elements.
         */
        end : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Executes the query, when finished the promise callback is called
         * if the query errors then the promise error is called.
         *
         * @return {comb.Promise} called back with results or the error call back is called with an error.
         */
        exec : function() {
            this.end();
            return this.db.query(this.sql);
        },

        /**
         * Close the connection.
         */
        close : function() {
            this.db.close();
        },

        getters : {
            sql : function() {
                return createSQLFromSplit(this.sqlObject);
            }
        }
    },

    static : {
        /**@lends SQL*/

        /**
         * Create a table.
         *
         * @param {moose.Table} table the table to create on the database
         * @param {moose.adapters.client.Query|moose.adapters.client.TransactionQuery} db the conneciton to the database.
         *
         * @return {comb.Promise} called back with results or the error call back is called with an error.
         */
        createTable : function(table, db) {
            var promise = new Promise();
            db.query(table.createTableSql).then(hitch(promise, "callback", true), hitch(promise, "errback"));
            return promise;
        },

        /**
         * Alter a table.
         *
         * @param {moose.Table} table the table to alter on the database
         * @param {moose.adapters.client.Query|moose.adapters.client.TransactionQuery} db the conneciton to the database.
         *
         * @return {comb.Promise} called back with results or the error call back is called with an error.
         */
        alterTable : function(table, db) {
            throw new Error("Not Implemented!");
        },

        /**
         * Drop a table.
         *
         * @param {moose.Table} table the table to drop on the database
         * @param {moose.adapters.client.Query|moose.adapters.client.TransactionQuery} db the conneciton to the database.
         *
         * @return {comb.Promise} called back with results or the error call back is called with an error.
         */
        dropTable : function(table, db) {
            throw new Error("Not Implemented!");
        },

        /**
         * Perform a batch insert into a table the objects.
         *
         * @param {String} table the name of the table
         * @param {Object} object the values to insert into the table
         * @param {moose.adapters.client.Query|moose.adapters.client.TransactionQuery} db the conneciton to the database.
         *
         * @return {comb.Promise} called back with results or the error call back is called with an error.
         */
        save : function(table, object, db) {
            throw new Error("Not Implemented!");
        },

        /**
         * Retrieve and create a {@link moose.Table} from a schema stored in the database.
         *
         * @param {String} tableName name of the table
         * @param {moose.adapters.client.Query|moose.adapters.client.TransactionQuery} db the conneciton to the database.
         *
         * @return {comb.Promise} called back with {@link moose.Table} or the error call back is called with an error.
         */
        schema : function(tableName, db) {
            throw new Error("Not Implemented!");
        },

        /**
         * Retrieve the last inserted id on a database.
         *
         * @param {moose.adapters.client.Query|moose.adapters.client.TransactionQuery} db the conneciton to the database.
         *
         * @return {comb.Promise} called back with id or the error call back is called with an error.
         */
        getLastInsertId : function(db) {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a foreign key statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        foreignKey : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a add foreign key statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        addForeignKey :function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a drop foreign key statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        dropForeignKey : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a primary key statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        primaryKey : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a add primary key statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        addPrimaryKey : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a drop primary key statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        dropPrimaryKey : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a unique constraint statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        unique : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a add unique constraint statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        addUnique : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a drop unique constraint statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        dropUnique : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a drop column statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        dropColumn : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create an alter column statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        alterColumn : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create a column statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        column : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Create an add column statement
         * <p><b>See your client adpater for parameters!</b></p>
         */
        addColumn : function() {
            throw new Error("Not Implemented!");
        },

        /**
         * Check if a type is a valid type for this adapter.
         * @return {Boolean} true if it is a valid type, false otherwise.
         */
        isValidType : function() {
            throw new Error("Not Implemented!");
        },
        client : null,
        types : null,

        /**
         * Formats and escapes query string.
         * @function
         * @param {String} sql the sql to format
         * @param {Array} array of values to place in the query.
         *
         * @return {String} the formatted string.
         */
        format : format

    }
});


