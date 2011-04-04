var vows = require('vows'),
        assert = require('assert'),
        moose = require("../lib"),
        helper = require("./data/dataset");
// Create a Test Suite
moose.createConnection({user : "test", password : "testpass", database : 'test'});

moose.execute(helper.sql).then(function(results) {
    var suite = vows.describe('mysql adapter');
    suite.addBatch({
        'looping through results': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find().forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.isNotNull(topic);
            }
        },

        'finding the first results': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find().first(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.eid, 1);
            }
        },


        'finding the all results': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find().all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.isArray(topic);
            }
        },

        'finding one results': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find().one().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.equal(topic.eid, 1);
            }
        },

        'finding last result': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find().last().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.equal(topic.eid, 21);
            }
        },

        'when calling run': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find().run().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.isArray(topic);
            }
        }
    });

    suite.addBatch({
        'find results in': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : [1,2,3,4,5,6]}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                var i = 1;
                assert.length(topic, 6);
                topic.forEach(function(t) {
                    assert.equal(i++, t.eid);
                });
            }
        },

        'find results not in': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.notIn({eid : [1,2,3,4,5,6]}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                var i = 7;
                assert.length(topic, 15);
                topic.forEach(function(t) {
                    assert.equal(i++, t.eid);
                });
            }
        }
    });

    suite.addBatch({
        'find results with limited columns': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.select(['firstname', 'lastname']).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                var i = 1;
                assert.length(topic, 21);
                topic.forEach(function(t) {
                    assert.isUndefined(t.eid);
                    assert.isUndefined(t.company_name);
                    assert.isUndefined(t.midinitial);
                    assert.isUndefined(t.salary);
                    assert.isTrue(typeof t.firstname == "string");
                    assert.isTrue(typeof t.lastname == "string");
                });
            }
        }
    });

    suite.addBatch({
        'when finding a number = zero': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.eq({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
                var record = topic[0];
                assert.equal(record.eid, 1);
            }
        },

        'when finding a number = zero using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
                var record = topic[0];
                assert.equal(record.eid, 1);
            }
        }
    });

    suite.addBatch({
        'when finding a number != 1': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.neq({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 20);
            }
        },

        'when finding a number != 1 using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : {neq : 1}}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 20);
            }
        }
    });

    suite.addBatch({
        'when finding a number > 1': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.gt({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 20);
            }
        },

        'when finding a number > 1 using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : {gt : 1}}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 20);
            }
        }
    });

    suite.addBatch({
        'when finding a number >= 1': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.gte({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 21);
            }
        },

        'when finding a number >= 1 using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : {gte : 1}}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 21);
            }
        }
    });

    suite.addBatch({
        'when finding a number < 1': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.lt({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 0);
            }
        },

        'when finding a number < 1 using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : {lt : 1}}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 0);
            }
        }
    });

    suite.addBatch({
        'when finding a number <= 1': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.lte({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
            }
        },

        'when finding a number <= 1 using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : {lte : 1}}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
            }
        }
    });

    suite.addBatch({
        'when finding a number <= 1': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.lte({eid : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
            }
        },

        'when finding a number <= 1 using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({eid : {lte : 1}}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
                ;
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
            }
        }
    });

    suite.addBatch({
        'when finding a flag is true': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.is({flag : true}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 1);
            }
        },

        'when finding a flag is false': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.is({flag : false}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 0);
            }
        },

        'when finding a flag is null': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.is({flag : null}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.isNull(topic);
            }
        },

        'when finding a flag is unknown': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.is({flag : "unknown"}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.isNull(topic);
            }
        },

        'when finding a flag is false another_flag is true and yet_another_flag is true': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.is({flag : false, another_flag : true, yet_another_flag : true}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 0);
                assert.equal(topic.another_flag, 1);
                assert.equal(topic.yet_another_flag, 1);
            }
        },

        'when finding a flag is false using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({flag : {is : false}}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 0);
            }
        }
    });

    suite.addBatch({
        'when finding a flag isNot true': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.isNot({flag : true}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 0);
            }
        },

        'when finding a flag isNot false': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.isNot({flag : false}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 1);
            }
        },

        'when finding a flag isNot null': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.isNot({flag : null}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.isNotNull(topic);
            }
        },

        'when finding a flag isNot unknown': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.isNot({flag : "unknown"}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.isNotNull(topic);
            }
        },

        'when finding a flag isNot false another_flag isNot true and yet_another_flag isNot true': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.isNot({flag : false, another_flag : true, yet_another_flag : true}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 1);
                assert.equal(topic.another_flag, 0);
                assert.equal(topic.yet_another_flag, 0);
            }
        },

        'when finding a flag isNot false using find': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.find({flag : {isNot : false}}).forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.flag, 1);
            }
        }
    });

    suite.addBatch({
        'when logically grouping queries': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.logicGroup({flag : {is : false}}).or().logicGroup({eid : 2}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.length(topic, 2)
                var rec1 = topic[0];
                var rec2 = topic[1];
                assert.equal(rec1.flag, 0);
                assert.equal(rec2.flag, 1);
                assert.equal(rec2.eid, 2);
            }
        }
    });

    suite.addBatch({

        'when ordering queries': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.order("firstname").all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                var names = ["Ann","Ann","Carole","Dan","Don","Eric","Jacky","John","Kim",
                    "Mary","Mary","Mike","Pam","Pat","Paul","Peter","Ron","Susan","Susan",
                    "Susanne","Tom"];
                assert.length(topic, 21);
                topic.forEach(function(rec, i) {
                    assert.equal(rec.firstname, names[i])
                });
            }
        },

        'when ordering queries desc': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.order({"firstname" : "desc"}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                var names = ["Ann","Ann","Carole","Dan","Don","Eric","Jacky","John","Kim",
                    "Mary","Mary","Mike","Pam","Pat","Paul","Peter","Ron","Susan","Susan",
                    "Susanne","Tom"].reverse();
                assert.length(topic, 21);
                topic.forEach(function(rec, i) {
                    assert.equal(rec.firstname, names[i])
                });
            }
        },

        'when ordering queries with one desc': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.order(["firstname", {"lastname" : "desc"}]).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                var lastNames = ["Schreck","Clemson","Wong","Brady","Young","Simon", "Quinn","Smith","Jackson","Gill","Dale",
                    "Peterson","Rand","Jason","Kumar","Chen","Thomson","Harrison","Anderson","Orr","Powell"];

                var names = ["Ann","Ann","Carole","Dan","Don","Eric","Jacky","John","Kim",
                    "Mary","Mary","Mike","Pam","Pat","Paul","Peter","Ron","Susan","Susan",
                    "Susanne","Tom"];
                assert.length(topic, 21);
                topic.forEach(function(rec, i) {
                    assert.equal(rec.firstname, names[i]);
                    assert.equal(rec.lastname, lastNames[i]);
                });
            }
        },

        'when chaining ordered queries with one desc': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.order("firstname").order({"lastname" : "desc"}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                var lastNames = ["Schreck","Clemson","Wong","Brady","Young","Simon", "Quinn","Smith","Jackson","Gill","Dale",
                    "Peterson","Rand","Jason","Kumar","Chen","Thomson","Harrison","Anderson","Orr","Powell"];

                var names = ["Ann","Ann","Carole","Dan","Don","Eric","Jacky","John","Kim",
                    "Mary","Mary","Mike","Pam","Pat","Paul","Peter","Ron","Susan","Susan",
                    "Susanne","Tom"];
                assert.length(topic, 21);
                topic.forEach(function(rec, i) {
                    assert.equal(rec.firstname, names[i]);
                    assert.equal(rec.lastname, lastNames[i]);
                });
            }
        }
    });

    suite.addBatch({
        'when joining two tables using join and object': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.join("employee", {eid : "eid"}).first().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.equal(topic.eid, 1);
                assert.equal(topic.gender, "F");
                assert.equal(topic.firstname, "Susan");
                assert.equal(topic.lastname, "Anderson");
                assert.equal(topic.street, "108th");
            }
        },

        'when joining two tables using join and object with where': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.join("employee", {eid : "eid"}).where({"works.eid" : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
                topic = topic[0];
                assert.equal(topic.eid, 1);
                assert.equal(topic.gender, "F");
                assert.equal(topic.firstname, "Susan");
                assert.equal(topic.lastname, "Anderson");
                assert.equal(topic.street, "108th");
            }
        },

        'when chaining joins two tables using join and object with where': {
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.join("employee", {eid : "eid"}).join("company", {company_name : "company_name"}).where({"works.eid" : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                assert.length(topic, 1);
                topic = topic[0];
                assert.equal(topic.eid, 1);
                assert.equal(topic.gender, "F");
                assert.equal(topic.firstname, "Susan");
                assert.equal(topic.lastname, "Anderson");
                assert.equal(topic.street, "108th");
                assert.equal(topic.company_name, "Mutual OF Omaha");
            }
        }
    });

    suite.addBatch({
        "when using group operation" :{
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.select("firstname")
                        .group("firstname").order({firstname : "desc"}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                var names = ["Ann","Carole","Dan","Don","Eric","Jacky","John","Kim",
                    "Mary","Mike","Pam","Pat","Paul","Peter","Ron","Susan",
                    "Susanne","Tom"].reverse();
                assert.length(topic, names.length);
                for (var i in topic) {
                    assert.equal(topic[i].firstname, names[i]);
                }
            }
        },

        "when using group operation using having operation" :{
            topic: function () {
                var self = this;
                var d = moose.getDataset("works");
                d.select("firstname")
                        .group("firstname", {firstname : {between : ['Ann', 'Eric']}}).order({firstname : "desc"})
                        .all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            'we get ': function (topic) {
                var names = ["Ann","Carole","Dan","Don","Eric"].reverse();
                assert.length(topic, names.length);
                for (var i in topic) {
                    assert.equal(topic[i].firstname, names[i]);
                }
                helper.dropModels();
            }
        }
    });

    suite.run({reporter : require("vows/reporters/spec")});
}, function(err) {
    throw err
});

