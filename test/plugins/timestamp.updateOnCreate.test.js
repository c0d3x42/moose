var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../lib"),
        hitch = moose.hitch,
        helper = require("../data/plugins.models");

helper.loadUpdateOnCreateModels().then(function() {
    Employee = moose.getModel("employee");
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

            "the updated time stamp should be set" : function(topic) {
                assert.isNotNull(topic.updated);
                assert.isNotNull(topic.created);
                assert.deepEqual(topic.updated, topic.created);
                assert.instanceOf(topic.updated, Date);
                assert.instanceOf(topic.created, Date);
                helper.dropUpdateOnCreateModels();
            }
        }
    });

    suite.run({reporter : require("vows/reporters/spec")});
});