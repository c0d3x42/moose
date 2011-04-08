var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../lib"),
        Mysql = moose.adapters.mysql,
        Client = require('mysql').Client,
        db = new Client();
// Create a Test Suite
var suite = vows.describe('mysql adapter');
suite.addBatch({
    'when finding all records with all fields': {
        topic: function () {
            return new Mysql("test", db).find().end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test");
        }
    }
});

suite.addBatch({
    'when finding all records with limited fields': {
        topic: function () {
            return new Mysql("test", db).select(["a", "b", "c"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select a, b, c from test");
        }
    }
});

suite.addBatch({
    'when finding a number = zero': {
        topic: function () {
            return new Mysql("test", db).eq({x : 0});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x = 0");
        }
    },

    'when using find and a number = 0': {
        topic: function () {
            return new Mysql("test", db).find({x : 0});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x = 0");
        }
    }
});

suite.addBatch({
    'when finding a number != zero': {
        topic: function () {
            return new Mysql("test", db).neq({x : 0});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x != 0");
        }
    },

    'when using find and a number != 0': {
        topic: function () {
            return new Mysql("test", db).find({x : {neq : 0}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x != 0");
        }
    }
});
suite.addBatch({
    'when finding a number > zero': {
        topic: function () {
            return new Mysql("test", db).gt({x : 0});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x > 0");
        }
    },

    'when using find and a number > 0': {
        topic: function () {
            return new Mysql("test", db).find({x : {gt : 0}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x > 0");
        }
    }
});

suite.addBatch({
    'when finding a number >= to zero': {
        topic: function () {
            return new Mysql("test", db).gte({x : 0});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x >= 0");
        }
    },

    'when using find and a number >= to one': {
        topic: function () {
            return new Mysql("test", db).find({x : {gte : 0}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x >= 0");
        }
    }
});

suite.addBatch({
    'when finding a number < one': {
        topic: function () {
            return new Mysql("test", db).lt({x : 1});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x < 1");
        }
    },

    'when using find and a number < to one': {
        topic: function () {
            return new Mysql("test", db).find({x : {lt : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x < 1");
        }
    }
});

suite.addBatch({
    'when finding a number <= to one': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1");
        }
    },

    'when using find and a number <= to one': {
        topic: function () {
            return new Mysql("test", db).find({x : {lte : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1");
        }
    }
});

suite.addBatch({
    'when finding a flag is true': {
        topic: function () {
            return new Mysql("test", db).is({flag : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is true");
        }
    },

    'when finding a flag is false': {
        topic: function () {
            return new Mysql("test", db).is({flag : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is false");
        }
    },

    'when finding a flag is null': {
        topic: function () {
            return new Mysql("test", db).is({flag : null});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is null");
        }
    },

    'when finding a flag is unknown': {
        topic: function () {
            return new Mysql("test", db).is({flag : "unknown"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is unknown");
        }
    },

    'when finding a flag is true and otherFlag is false and anotherFlag is unknown and yetAnotherFlag is null': {
        topic: function () {
            return new Mysql("test", db).is({flag : true, otherFlag : false, anotherFlag : "unknown", yetAnotherFlag : null});
        },
        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is true and otherFlag is false and anotherFlag is unknown and yetAnotherFlag is null");
        }
    },

    'when using find and is operation': {
        topic: function () {
            return new Mysql("test", db).find({flag : {is : "unknown"}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is unknown");
        }
    }
});

suite.addBatch({
    'when finding a flag is not true': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not true");
        }
    },

    'when finding a flag is not false': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not false");
        }
    },

    'when finding a flag is not null': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : null});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null");
        }
    },

    'when finding a flag is not unknown': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : "unknown"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not unknown");
        }
    },

    'when finding a flag isNot true and otherFlag isNot false and anotherFlag isNot unknown and yetAnotherFlag isNot null': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : true, otherFlag : false, anotherFlag : "unknown", yetAnotherFlag : null});
        },
        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not true and otherFlag is not false and anotherFlag is not unknown and yetAnotherFlag is not null");
        }
    },

    'when using find and is operations': {
        topic: function () {
            return new Mysql("test", db).find({flag : {isNot : "unknown"}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not unknown");
        }
    }
});

suite.addBatch({
    'when finding a flag is null': {
        topic: function () {
            return new Mysql("test", db).isNull("flag");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is null");
        }
    }
});

suite.addBatch({
    'when finding a flag is not null': {
        topic: function () {
            return new Mysql("test", db).isNotNull("flag");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null");
        }
    }
});

suite.addBatch({
    'when chaining is commands together': {
        topic: function () {
            return new Mysql("test", db).is({flag : false}).isNot({flag : "unknown"}).isNull("anotherFlag").isNotNull("yetAnotherFlag");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null");
        }
    }
});

suite.addBatch({
    'when finding a flag is not null and flag is true or flag is false': {
        topic: function () {
            return new Mysql("test", db).isNotNull("flag").is({flag : true}).or({flag : {is : false}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null and flag is true or flag is false");
        }
    }
});

suite.addBatch({
    'when finding a flag is not null and flag is true or flag is false': {
        topic: function () {
            return new Mysql("test", db).isNotNull("flag").is({flag : true}).or({flag : {is : false}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null and flag is true or flag is false");
        }
    }
});

suite.addBatch({
    'when grouping queries': {
        topic: function () {
            return new Mysql("test", db).logicGroup({flag : {isNot : null}, x : 1}).or().logicGroup({x : 2});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where (flag is not null and x = 1) or (x = 2)");
        }
    },

    'when grouping queries nested in or': {
        topic: function () {
            return new Mysql("test", db).logicGroup({flag : {isNot : null}, x : 1}).or().logicGroup({x : 2});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where (flag is not null and x = 1) or (x = 2)");
        }
    }
});

suite.addBatch({
    'when ordering queries': {
        topic: function () {
            return new Mysql("test", db).order("x");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test order by x");
        }
    },

    'when ordering queries desc': {
        topic: function () {
            return new Mysql("test", db).order({x : "desc"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test order by x desc");
        }
    },

    'when ordering by multiple properties': {
        topic: function () {
            return new Mysql("test", db).order(["x", "y"]);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test order by x, y");
        }
    },

    'when ordering by multiple properties one desc': {
        topic: function () {
            return new Mysql("test", db).order(["x", {y : "desc"}]);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test order by x, y desc");
        }
    },

    'when ordering by multiple properties both desc': {
        topic: function () {
            return new Mysql("test", db).order([
                {x : "desc"},
                {y : "desc"}
            ]);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test order by x desc, y desc");
        }
    },

    'when chaining ordering queries': {
        topic: function () {
            return new Mysql("test", db).order("x").order("y").order({z : "desc"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test order by x, y, z desc");
        }
    }


});

suite.addBatch({
    'when finding a number <= to one and y >= 1': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).gte({y : 1});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one and y >= 1 using and': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).and({y : { gte : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one and y >= 1 using and chain': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).and().gte({y : 1});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one or y >= 1 or': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).or({y : {gte : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 or y >= 1");
        }
    },

    'when finding a number <= to one or y >= 1 using or chain': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).or().gte({y : 1});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 or y >= 1");
        }
    }
});

suite.addBatch({
    'when joining two tables using join and object': {
        topic: function () {
            return new Mysql("test", db).join("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test inner join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using join and array': {
        topic: function () {
            return new Mysql("test", db).join("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test inner join test2 using (id, name)");
        }
    }
});


suite.addBatch({
    'when joining two tables using left join and object': {
        topic: function () {
            return new Mysql("test", db).leftJoin("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test left join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using left join and array': {
        topic: function () {
            return new Mysql("test", db).leftJoin("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test left join test2 using (id, name)");
        }
    }
});

suite.addBatch({
    'when joining two tables using right join and object': {
        topic: function () {
            return new Mysql("test", db).rightJoin("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test right join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using right join and array': {
        topic: function () {
            return new Mysql("test", db).rightJoin("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test right join test2 using (id, name)");
        }
    }
});

suite.addBatch({
    'when joining two tables using full join and object': {
        topic: function () {
            return new Mysql("test", db).fullJoin("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test full join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using full join and array': {
        topic: function () {
            return new Mysql("test", db).fullJoin("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test full join test2 using (id, name)");
        }
    }
});

suite.addBatch({
    'when joining two tables using left outer join and object': {
        topic: function () {
            return new Mysql("test", db).leftOuterJoin("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test left outer join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using left outer join and array': {
        topic: function () {
            return new Mysql("test", db).leftOuterJoin("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test left outer join test2 using (id, name)");
        }
    }
});

suite.addBatch({
    'when joining two tables using right outer join and object': {
        topic: function () {
            return new Mysql("test", db).rightOuterJoin("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test right outer join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using right outer join and array': {
        topic: function () {
            return new Mysql("test", db).rightOuterJoin("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test right outer join test2 using (id, name)");
        }
    }
});

suite.addBatch({
    'when joining two tables using full outer join and object': {
        topic: function () {
            return new Mysql("test", db).fullOuterJoin("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test full outer join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using full outer join and array': {
        topic: function () {
            return new Mysql("test", db).fullOuterJoin("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test full outer join test2 using (id, name)");
        }
    }
});

suite.addBatch({
    'when joining two tables using inner join and object': {
        topic: function () {
            return new Mysql("test", db).innerJoin("test2", {id : "id"}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test inner join test2 on test.id=test2.id");
        }
    },

    'when joining two tables using inner join and array': {
        topic: function () {
            return new Mysql("test", db).innerJoin("test2", ["id", "name"]).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test inner join test2 using (id, name)");
        }
    }
});

suite.addBatch({
    'when joining two tables using cross join': {
        topic: function () {
            return new Mysql("test", db).crossJoin("test2");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test cross join test2");
        }
    }
});

suite.addBatch({
    'when joining two tables using natural full join': {
        topic: function () {
            return new Mysql("test", db).naturalFullJoin("test2");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test natural full join test2");
        }
    }
});

suite.addBatch({
    'when joining two tables using natural right join': {
        topic: function () {
            return new Mysql("test", db).naturalRightJoin("test2");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test natural right join test2");
        }
    }
});
suite.addBatch({
    'when joining two tables using natural left join': {
        topic: function () {
            return new Mysql("test", db).naturalLeftJoin("test2");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test natural left join test2");
        }
    }
});
suite.addBatch({
    'when joining two tables using natural join': {
        topic: function () {
            return new Mysql("test", db).naturalJoin("test2");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test natural join test2");
        }
    }
});

suite.addBatch({
    'when chaining join operations': {
        topic: function () {
            return new Mysql("test", db).join("test2", {id : "id"}).leftJoin("test3", ["name"]);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test inner join test2 on test.id=test2.id left join test3 using (name)");
        }
    },

    'when chaining join condition and unconditioned join operations': {
        topic: function () {
            return new Mysql("test", db).join("test2", ["id", "name"]).naturalJoin("test3");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test inner join test2 using (id, name) natural join test3");
        }
    }
});

suite.addBatch({
    'when chaining join operations and where clause': {
        topic: function () {
            return new Mysql("test", db).join("test2", {id : "id"}).leftJoin("test3", ["name"]).eq({x : 2}).or({x : 3});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test inner join test2 on test.id=test2.id left join test3 using (name) where x = 2 or x = 3");
        }
    }
});

suite.addBatch({
    'when using in operation': {
        topic: function () {
            return new Mysql("test", db)["in"]({id : [1,2,3,4,5]}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where id in (1,2,3,4,5)");
        }
    },
    'when using not in operation': {
        topic: function () {
            return new Mysql("test", db).notIn({id : [1,2,3,4,5]}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where id not in (1,2,3,4,5)");
        }
    },
    'when chaining in and notIn operation': {
        topic: function () {
            return new Mysql("test", db)["in"]({id : [1,2,3,4,5]}).notIn({id2 : [6,7,8,9,10]}).end();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where id in (1,2,3,4,5) and id2 not in (6,7,8,9,10)");
        }
    },

    'when nesting in operations': {
        topic: function () {
            return new Mysql("test", db)["in"]({id : [1,2,3,4,5], id2 : [6,7,8,9,10]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where id in (1,2,3,4,5) and id2 in (6,7,8,9,10)");
        }
    },

    'when nesting in with another Mysql query': {
        topic: function () {
            return new Mysql("test", db)["in"]({id : new Mysql("test2", db).select("id2").between({name : ["A", "B"]})});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where id in (select id2 from test2 where name >= 'A' and name <= 'B')");
        }
    },

    'when using find and in operations': {
        topic: function () {
            return new Mysql("test", db).find({id : [1,2,3,4,5], id2 : [6,7,8,9,10]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where id in (1,2,3,4,5) and id2 in (6,7,8,9,10)");
        }
    }
});

suite.addBatch({
    'when limiting result set': {
        topic: function () {
            return new Mysql("test", db).limit(1);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test limit 1");
        }
    },

    'when limiting result set with offset': {
        topic: function () {
            return new Mysql("test", db).limit(1, 10);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test limit 1 offset 10");
        }
    },

    'when limiting result set with a query': {
        topic: function () {
            return new Mysql("test", db).find({a : {gte : "b"}}).limit(1);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where a >= 'b' limit 1");
        }
    }
});

suite.addBatch({
    'when querying with like': {
        topic: function () {
            return new Mysql("test", db).like({name : "bob"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where name like 'bob'");
        }
    },

    'when querying with not like': {
        topic: function () {
            return new Mysql("test", db).notLike({name : "bob"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where name not like 'bob'");
        }
    },

    'when querying like with find': {
        topic: function () {
            return new Mysql("test", db).find({firstName : {like : 'bob'}, lastName : {notLike : "henry"}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where firstName like 'bob' and lastName not like 'henry'");
        }
    }
});

suite.addBatch({
    'when limiting result set with offset': {
        topic: function () {
            return new Mysql("test", db).limit(1, 10);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test limit 1 offset 10");
        }
    },

    'when limiting result set with a query': {
        topic: function () {
            return new Mysql("test", db).find({a : {gte : "b"}}).offset(10);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where a >= 'b' offset 10");
        }
    }
});

suite.addBatch({
    'when selecting distinct result': {
        topic: function () {
            return new Mysql("test", db).find({id : 1}).distinct();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select distinct * from test where id = 1");
        }
    },

    'when select distinct result sets with a query': {
        topic: function () {
            return new Mysql("test", db).join("test2", {id : "id"}).where({"test2.other" : 1}).select("test.*").distinct();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select distinct test.* from test inner join test2 on test.id=test2.id where test2.other = 1");
        }
    }
});

suite.addBatch({
    'when grouping result set': {
        topic: function () {
            return new Mysql("test", db).group("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test group by name");
        }
    },

    'when grouping result set with an array of columns': {
        topic: function () {
            return new Mysql("test", db).group(["name", "age"]);
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test group by name, age");
        }
    },
    'when grouping result set with a having clause': {
        topic: function () {
            return new Mysql("test", db).group("name", {name : "bob"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test group by name having name = 'bob'");
        }
    },

    'when grouping result set with an array of columns and a having clause': {
        topic: function () {
            return new Mysql("test", db).group(["name", "age"], {age : {between : [10, 20]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test group by name, age having age >= 10 and age <= 20");
        }
    },

    'when grouping result set with an array of columns and using having function': {
        topic: function () {
            return new Mysql("test", db).group(["name", "age"]).having({age : {between : [10, 20]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test group by name, age having age >= 10 and age <= 20");
        }
    },


    'when grouping result set with an array of columns and using find function': {
        topic: function () {
            return new Mysql("test", db).group(["name", "age"]).having().find({age : {between : [10, 20]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test group by name, age having age >= 10 and age <= 20");
        }
    },


    'when grouping result set with an array of columns and using find function': {
        topic: function () {
            return new Mysql("test", db).group(["name", "age"]).having().isNull("age");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test group by name, age having age is null");
        }
    },

    'when grouping result set with variance': {
        topic: function () {
            return new Mysql("test", db).groupAndVariance("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, variance(name) as name_variance from test group by name");
        }
    },

    'when grouping result set with varSamp': {
        topic: function () {
            return new Mysql("test", db).groupAndVarSamp("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, var_samp(name) as name_var_samp from test group by name");
        }
    },
    'when grouping result set with varPop': {
        topic: function () {
            return new Mysql("test", db).groupAndVarPop("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, var_pop(name) as name_var_pop from test group by name");
        }
    },

    'when grouping result set with stdDev': {
        topic: function () {
            return new Mysql("test", db).groupAndStdDev("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, stddev(name) as name_stddev from test group by name");
        }
    },
    'when grouping result set with stdDevSamp': {
        topic: function () {
            return new Mysql("test", db).groupAndStdDevSamp("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, stddev_samp(name) as name_stddev_samp from test group by name");
        }
    },

    'when grouping result set with stdDevPop': {
        topic: function () {
            return new Mysql("test", db).groupAndStdDevPop("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, stddev_pop(name) as name_stddev_pop from test group by name");
        }
    },

    'when grouping result set with std': {
        topic: function () {
            return new Mysql("test", db).groupAndStd("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, std(name) as name_std from test group by name");
        }
    },

    'when grouping result set with bitXor': {
        topic: function () {
            return new Mysql("test", db).groupAndBitXor("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, bit_xor(name) as name_bit_xor from test group by name");
        }
    },

    'when grouping result set with bitOr': {
        topic: function () {
            return new Mysql("test", db).groupAndBitOr("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, bit_or(name) as name_bit_or from test group by name");
        }
    },

    'when grouping result set with bitAnd': {
        topic: function () {
            return new Mysql("test", db).groupAndBitAnd("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, bit_and(name) as name_bit_and from test group by name");
        }
    },


    'when grouping result set with max': {
        topic: function () {
            return new Mysql("test", db).groupAndMax("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, max(name) as name_max from test group by name");
        }
    },

    'when grouping result set with min': {
        topic: function () {
            return new Mysql("test", db).groupAndMin("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, min(name) as name_min from test group by name");
        }
    },


    'when grouping result set with avg': {
        topic: function () {
            return new Mysql("test", db).groupAndAvg("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, avg(name) as name_avg from test group by name");
        }
    },


    'when grouping result set with sum': {
        topic: function () {
            return new Mysql("test", db).groupAndSum("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, sum(name) as name_sum from test group by name");
        }
    },

    'when grouping result set with count': {
        topic: function () {
            return new Mysql("test", db).groupAndCount("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select *, count(name) as name_count from test group by name");
        }
    }
});

suite.addBatch({
    'when querying with variance': {
        topic: function () {
            return new Mysql("test", db).variance("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select variance(name) as name_variance from test");
        }
    },

    'when querying with varSamp': {
        topic: function () {
            return new Mysql("test", db).varSamp("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select var_samp(name) as name_var_samp from test");
        }
    },
    'when querying with varPop': {
        topic: function () {
            return new Mysql("test", db).varPop("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select var_pop(name) as name_var_pop from test");
        }
    },

    'when querying with stdDev': {
        topic: function () {
            return new Mysql("test", db).stdDev("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select stddev(name) as name_stddev from test");
        }
    },
    'when querying with stdDevSamp': {
        topic: function () {
            return new Mysql("test", db).stdDevSamp("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select stddev_samp(name) as name_stddev_samp from test");
        }
    },

    'when querying with stdDevPop': {
        topic: function () {
            return new Mysql("test", db).stdDevPop("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select stddev_pop(name) as name_stddev_pop from test");
        }
    },

    'when querying with std': {
        topic: function () {
            return new Mysql("test", db).std("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select std(name) as name_std from test");
        }
    },

    'when querying with bitXor': {
        topic: function () {
            return new Mysql("test", db).bitXor("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select bit_xor(name) as name_bit_xor from test");
        }
    },

    'when querying with bitOr': {
        topic: function () {
            return new Mysql("test", db).bitOr("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select bit_or(name) as name_bit_or from test");
        }
    },

    'when querying with bitAnd': {
        topic: function () {
            return new Mysql("test", db).bitAnd("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select bit_and(name) as name_bit_and from test");
        }
    },


    'when querying with max': {
        topic: function () {
            return new Mysql("test", db).max("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select max(name) as name_max from test");
        }
    },

    'when querying with min': {
        topic: function () {
            return new Mysql("test", db).min("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select min(name) as name_min from test");
        }
    },


    'when querying with avg': {
        topic: function () {
            return new Mysql("test", db).avg("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select avg(name) as name_avg from test");
        }
    },


    'when querying with sum': {
        topic: function () {
            return new Mysql("test", db).sum("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select sum(name) as name_sum from test");
        }
    },

    'when querying with count': {
        topic: function () {
            return new Mysql("test", db).count("name");
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select count(name) as name_count from test");
        }
    },

    'when querying with count without options': {
        topic: function () {
            return new Mysql("test", db).count();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select count(*) as count from test");
        }
    }
});

suite.addBatch({
    'when finding values between two values': {
        topic: function () {
            return new Mysql("test", db).between({x : [1,5]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x >= 1 and x <= 5");
        }
    },

    'when finding values not between two values': {
        topic: function () {
            return new Mysql("test", db).notBetween({x : [1,5]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and x >= 5");
        }
    },

    'when finding values not between two values with strings': {
        topic: function () {
            return new Mysql("test", db).notBetween({x : ["a","b"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 'a' and x >= 'b'");
        }
    },

    'when finding values not between two values with strings uning find': {
        topic: function () {
            return new Mysql("test", db).find({x : {notBetween : ["a","b"]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 'a' and x >= 'b'");
        }
    },

    'when finding values between two values with strings uning find': {
        topic: function () {
            return new Mysql("test", db).find({x : {between : ["a","b"]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x >= 'a' and x <= 'b'");
        }
    }
});

suite.addBatch({
    'when updating': {
        topic: function () {
            return new Mysql("test", db).update({x : 1});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "update test set x=1");
        }
    },

    'when updating with query': {
        topic: function () {
            return new Mysql("test", db).update({x : 1}, {x : {between : [1,5]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "update test set x=1 where x >= 1 and x <= 5");
        }
    },

    'when updating with where func': {
        topic: function () {
            return new Mysql("test", db).update({x : 1}).where({x : {between : [1,5]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "update test set x=1 where x >= 1 and x <= 5");
        }
    },

    'when updating with find func': {
        topic: function () {
            return new Mysql("test", db).update({x : 1}).find({x : {between : [1,5]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "update test set x=1 where x >= 1 and x <= 5");
        }
    },

    'when updating with join': {
        topic: function () {
            return new Mysql("test", db).update({x : 1}).join("test2", {flag : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "update test inner join test2 on test.flag=test2.false set x=1");
        }
    }
});

suite.addBatch({
    'when deleting': {
        topic: function () {
            return new Mysql("test", db).remove();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "delete from test");
        }
    },

    'when deleting with query': {
        topic: function () {
            return new Mysql("test", db).remove(null, {x : {between : [1,5]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "delete from test where x >= 1 and x <= 5");
        }
    },

    'when deleting with where func': {
        topic: function () {
            return new Mysql("test", db).remove().where({x : {between : [1,5]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "delete from test where x >= 1 and x <= 5");
        }
    },

    'when deleting with find func': {
        topic: function () {
            return new Mysql("test", db).remove().find({x : {between : [1,5]}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "delete from test where x >= 1 and x <= 5");
        }
    },

    'when deleting with join': {
        topic: function () {
            return new Mysql("test", db).remove().join("test2", {flag : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "delete test from test inner join test2 on test.flag=test2.false");
        }
    },

    'when deleting with multiple tables': {
        topic: function () {
            return new Mysql("test", db).remove("test2").join("test2", {flag : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "delete test, test2 from test inner join test2 on test.flag=test2.false");
        }
    }
});

suite.addBatch({
    'when finding a number > zero': {
        topic: function () {
            return new Mysql("test", db).find({x : {gt : 0}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x > 0");
        }
    },
    'when finding a number >= to 0': {
        topic: function () {
            return new Mysql("test", db).find({x : {gte : 0}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x >= 0");
        }
    },

    'when finding a number < 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {lt : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x < 1");
        }
    },

    'when finding a number <= to 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {lte : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1");
        }
    },

    'when finding x <= to 1 and  y >= to 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {lte : 1}, y : {gte : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding x > 0 and  y >= 1 z < 1 k <= 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {gt : 0}, y : {gte : 1}, z : {lt : 1}, k : {lte : 1}});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x > 0 and y >= 1 and z < 1 and k <= 1");
        }
    }
});

suite.export(module);
