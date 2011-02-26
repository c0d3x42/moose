var vows = require('vows'),
        assert = require('assert'),
        Mysql = require("../../lib/adapters").mysql,
        Client = require('mysql').Client,
        db = new Client();
// Create a Test Suite
console.log(Mysql);
var suite = vows.describe('mysql adapter')
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
            return new Mysql("test", db).eq({x : 0})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x = 0");
        }
    }
});

suite.addBatch({
    'when finding a number != zero': {
        topic: function () {
            return new Mysql("test", db).neq({x : 0})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x != 0");
        }
    }
});
suite.addBatch({
    'when finding a number > zero': {
        topic: function () {
            return new Mysql("test", db).gt({x : 0})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x > 0");
        }
    }
});

suite.addBatch({
    'when finding a number >= to zero': {
        topic: function () {
            return new Mysql("test", db).gte({x : 0})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x >= 0");
        }
    }
});

suite.addBatch({
    'when finding a number < one': {
        topic: function () {
            return new Mysql("test", db).lt({x : 1})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x < 1");
        }
    }
});

suite.addBatch({
    'when finding a number <= to one': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1");
        }
    }
});

suite.addBatch({
    'when finding a flag is true': {
        topic: function () {
            return new Mysql("test", db).is({flag : true})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is true");
        }
    },

    'when finding a flag is false': {
        topic: function () {
            return new Mysql("test", db).is({flag : false})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is false");
        }
    },

    'when finding a flag is null': {
        topic: function () {
            return new Mysql("test", db).is({flag : null})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is null");
        }
    },

    'when finding a flag is unknown': {
        topic: function () {
            return new Mysql("test", db).is({flag : "unknown"})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is unknown");
        }
    },

    'when finding a flag is true and otherFlag is false and anotherFlag is unknown and yetAnotherFlag is null': {
        topic: function () {
            return new Mysql("test", db).is({flag : true, otherFlag : false, anotherFlag : "unknown", yetAnotherFlag : null})
        },
        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is true and otherFlag is false and anotherFlag is unknown and yetAnotherFlag is null");
        }
    }
});

suite.addBatch({
    'when finding a flag is not true': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : true})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not true");
        }
    },

    'when finding a flag is not false': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : false})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not false");
        }
    },

    'when finding a flag is not null': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : null})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null");
        }
    },

    'when finding a flag is not unknown': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : "unknown"})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not unknown");
        }
    },

    'when finding a flag isNot true and otherFlag isNot false and anotherFlag isNot unknown and yetAnotherFlag isNot null': {
        topic: function () {
            return new Mysql("test", db).isNot({flag : true, otherFlag : false, anotherFlag : "unknown", yetAnotherFlag : null})
        },
        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not true and otherFlag is not false and anotherFlag is not unknown and yetAnotherFlag is not null");
        }
    }
});

suite.addBatch({
    'when finding a flag is null': {
        topic: function () {
            return new Mysql("test", db).isNull("flag")
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is null");
        }
    }
});

suite.addBatch({
    'when finding a flag is not null': {
        topic: function () {
            return new Mysql("test", db).isNotNull("flag")
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null");
        }
    }
});

suite.addBatch({
    'when chaining is commands together': {
        topic: function () {
            return new Mysql("test", db).is({flag : false}).isNot({flag : "unknown"}).isNull("anotherFlag").isNotNull("yetAnotherFlag")
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is false and flag is not unknown and anotherFlag is null and yetAnotherFlag is not null");
        }
    }
});

suite.addBatch({
    'when finding a flag is not null and flag is true or flag is false': {
        topic: function () {
            return new Mysql("test", db).isNotNull("flag").is({flag : true}).or({flag : {is : false}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null and flag is true or flag is false");
        }
    }
});

suite.addBatch({
    'when finding a flag is not null and flag is true or flag is false': {
        topic: function () {
            return new Mysql("test", db).isNotNull("flag").is({flag : true}).or({flag : {is : false}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where flag is not null and flag is true or flag is false");
        }
    }
});

suite.addBatch({
    'when grouping queries': {
        topic: function () {
            return new Mysql("test", db).group({flag : {isNot : null}, x : 1}).or().group({x : 2});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where (flag is not null and x = 1) or (x = 2)");
        }
    },

    'when grouping queries nested in or': {
        topic: function () {
            return new Mysql("test", db).group({flag : {isNot : null}, x : 1}).or().group({x : 2});
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
            return new Mysql("test", db).order([{x : "desc"}, {y : "desc"}]);
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
    },


});

suite.addBatch({
    'when finding a number <= to one and y >= 1': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).gte({y : 1})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one and y >= 1 using and': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).and({y : { gte : 1}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one and y >= 1 using and chain': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).and().gte({y : 1})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one or y >= 1 or': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).or({y : {gte : 1}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 or y >= 1");
        }
    },

    'when finding a number <= to one or y >= 1 using or chain': {
        topic: function () {
            return new Mysql("test", db).lte({x : 1}).or().gte({y : 1})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 or y >= 1");
        }
    },
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
    'when finding a number > zero': {
        topic: function () {
            return new Mysql("test", db).find({x : {gt : 0}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x > 0");
        }
    },
    'when finding a number >= to 0': {
        topic: function () {
            return new Mysql("test", db).find({x : {gte : 0}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x >= 0");
        }
    },

    'when finding a number < 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {lt : 1}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x < 1");
        }
    },

    'when finding a number <= to 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {lte : 1}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1");
        }
    },

    'when finding x <= to 1 and  y >= to 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {lte : 1}, y : {gte : 1}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding x > 0 and  y >= 1 z < 1 k <= 1': {
        topic: function () {
            return new Mysql("test", db).find({x : {gt : 0}, y : {gte : 1}, z : {lt : 1}, k : {lte : 1}})
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, "select * from test where x > 0 and y >= 1 and z < 1 and k <= 1");
        }
    }
});

suite.run(); // Run it