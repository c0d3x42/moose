var vows = require('vows'),
        assert = require('assert'),
        helper = require("./data/oneToOne.customFilter.lazy.models"),
        moose = require("../lib"),
        comb = require("comb"),
        Promise = comb.Promise,
        hitch = comb.hitch;


var gender = ["M", "F"];
helper.loadModels().then(function() {
    var Works = moose.getModel("works"), Employee = moose.getModel("employee");
    var suite = vows.describe("One to One Eager association ");
    suite.addBatch({

        "When creating a employee " : {
            topic : function() {
                var e1 = new Employee({
                    lastname : "last" + 1,
                    firstname : "first" + 1,
                    midinitial : "m",
                    gender : gender[1 % 2],
                    street : "Street " + 1,
                    city : "City " + 1,
                    works : {
                        companyName : "Google",
                        salary : 100000
                    }
                }).save().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            " the employee should work at google " : function(employee) {
                var works = employee.works;
                assert.equal(works.companyName, "Google");
                assert.equal(works.salary, 100000);
                return employee;
            }
        }

    });

    suite.addBatch({

        "When finding an employee" : {
            topic : function() {
                Employee.one().then(hitch(this, "callback", null), hitch(this, "callback"));
            },


            " the employees work should not be loaded yet" : {
                topic : function(employee) {
                    var works = employee.works;
                    assert.instanceOf(works, Promise);
                    works.then(hitch(this, "callback", null, employee), hitch(this, "callback"));
                },

                " but now it should" : function(employee) {
                    var works = employee.works;
                    assert.equal(works.companyName, "Google");
                    assert.equal(works.salary, 100000);
                    return employee;
                }
            },

            " the employees custom work should not be loaded yet" : {
                topic : function(employee) {
                    var works = employee.customWorks;
                    assert.instanceOf(works, Promise);
                    works.then(hitch(this, "callback", null, employee), hitch(this, "callback"));
                },

                " but now it should" : function(employee) {
                    var works = employee.customWorks;
                    assert.equal(works.companyName, "Google");
                    assert.equal(works.salary, 100000);
                    return employee;
                }
            }
        },
        teardown : function() {
            helper.dropModels();
        }
    });

    suite.run({reporter : require("vows/reporters/spec")});
});
