var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../lib"),
        hitch = moose.hitch,
        helper = require("../data/plugins.models");

helper.loadDefaultModels().then(function() {
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
                    e.reload().then(hitch(this, "callback", null));
                }));
            },

            "the updatedAt time stamp should not be set" : function(topic) {
                assert.isNull(topic.updated);
            },

            "the createdAt time stamp should be set" : function(topic) {
                assert.isNotNull(topic.created);
                assert.instanceOf(topic.created, Date);
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
                    assert.isNotNull(topic.updated);
                    assert.instanceOf(topic.updated, Date);
                    assert.notDeepEqual(topic.updated, topic.created);
                    helper.dropDefaultModels();
                }
            }
        }
    });

    suite.run({reporter : require("vows/reporters/spec")});
});
