var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../lib"),
        comb = require("comb"),
        hitch = comb.hitch,
        helper = require("../data/plugins.models");

helper.loadCustomModels().then(function() {
    Employee = moose.getModel("employee");
    var suite = vows.describe("TimeStampPlugin updateOnCreate");

    suite.addBatch({

        "when creating an employee" : {
            topic : function() {
                Employee.save({
                    id : 1,
                    firstname : "doug",
                    lastname : "martin",
                    midinitial : null,
                    gender : "M",
                    street : "1 nowhere st.",
                    city : "NOWHERE"
                }).then(hitch(this, function(e) {
                    //force reload
                    e.reload().then(hitch(this, "callback", null), hitch(this, "callback"));
                }), hitch(this, "callback"));
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
                    helper.dropCustomModels();
                }
            }
        }
    });

    suite.run({reporter : require("vows/reporters/spec")});
});