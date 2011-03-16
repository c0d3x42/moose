var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../lib"),
        hitch = moose.hitch,
        mysql = moose.adapters.mysql,
        types = mysql.types;

moose.createConnection({user : "root",database : 'test'});
var suite = vows.describe("model object");


var schema = new moose.Table("employee", {
    id :             types.INT({allowNull : false, primaryKey : true, primaryKey : true, autoIncrement : true}),
    firstname :       types.VARCHAR({length : 20, allowNull : false}),
    lastname :        types.VARCHAR({length : 20, allowNull : false}),
    midinitial :      types.CHAR({length : 1}),
    gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
    street :          types.VARCHAR({length : 50, allowNull : false}),
    city :            types.VARCHAR({length : 20, allowNull : false}),
    updatedAt :         types.DATETIME(),
    createdAt :         types.DATETIME()
});

var Employee = moose.addModel(schema, {
    plugins : [moose.plugins.TimeStampPlugin]
});

Employee.timestamp({updated : "updatedAt", created : "createdAt"});

moose.refresh(schema).then(function() {
    var suite = vows.describe("TimeStampPlugin updateOnCreate");

    suite.addBatch({

        "when creating an employee" : {
            topic : function() {
                Employee.save({
                    eid : 1,
                    firstname : "doug",
                    lastname : "martin",
                    midinitial : null,
                    gender : "M",
                    street : "1 nowhere st.",
                    city : "NOWHERE"
                }).then(hitch(this, function(e) {
                    //force reload
                    e.reload().then(hitch(this, "callback", null));
                }));
            },

            "the updatedAt time stamp should not be set" : function(topic) {
                assert.isNull(topic.updatedAt);
            },

            "the createdAt time stamp should be set" : function(topic) {
                assert.isNotNull(topic.createdAt);
                assert.instanceOf(topic.createdAt, Date);
            },

            "when updating an employee" : {
                topic : function(e) {
                    //setTimeout to ensure new timeout
                    setTimeout(hitch(this, function() {
                        e.firstname = "dave";
                        e.save().then(hitch(this, function(e) {
                            //force reload
                            e.reload().then(hitch(this, "callback", null));
                        }));
                    }), 1000);
                },

                "the updated time stamp should be set" : function(topic) {
                    assert.isNotNull(topic.updatedAt);
                    assert.instanceOf(topic.updatedAt, Date);
                    assert.notDeepEqual(topic.updatedAt, topic.createdAt);
                }
            }
        }
    });

    suite.run({reporter : require("vows/reporters/spec")});
});