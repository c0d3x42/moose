var vows = require('vows'),
        assert = require('assert'),
        helper = require("./data/manyToOne.customFilter.lazy.models"),
        moose = require("../lib"),
        hitch = moose.hitch;

var gender = ["M", "F"];
helper.loadModels().then(function() {
    var Company = moose.getModel("company"), Employee = moose.getModel("employee");
    var suite = vows.describe("Many to one Eager association ");

    suite.addBatch({

        "When creating a company with employees " : {
            topic : function() {
                var c1 = new Company({
                    companyName : "Google",
                    employees : [
                        {
                            lastname : "last" + 1,
                            firstname : "first" + 1,
                            midinitial : "m",
                            gender : gender[1 % 2],
                            street : "Street " + 1,
                            city : "Omaha"
                        },
                        {
                            lastname : "last" + 2,
                            firstname : "first" + 2,
                            midinitial : "m",
                            gender : gender[1 % 2],
                            street : "Street " + 2,
                            city : "Omaha"
                        },
                        {
                            lastname : "last" + 3,
                            firstname : "first" + 3,
                            midinitial : "m",
                            gender : gender[3 % 2],
                            street : "Street " + 3,
                            city : "City " + 3
                        }
                    ]
                });
                c1.save().then(hitch(this, function(c) {
                    this.callback(null, c);
                }), hitch(this, "callback"));
            },

            "and retrieving omaha employees " : {
                topic : function(company) {
                   company.omahaEmployees.then(hitch(this, "callback", null), hitch(this, "callback"));
                },

                "there should be two " : function(emps) {
                    assert.length(emps, 2);
                    emps.forEach(function(emp, i) {
                        assert.equal(emp.id, i + 1);
                        assert.equal(emp.city, "Omaha");
                    });
                }
            },

            "and retrieving all employees  " : {
                topic : function(company) {
                    return company.employees;
                },

                "there should be three" : function(emps) {
                    assert.length(emps, 3);
                    emps.forEach(function(emp, i) {
                        assert.equal(i + 1, emp.id);
                    });
                }
            }
        }
    });

    suite.addBatch({
        "When querying the employees " : {
            topic : function() {
                Employee.filter({companyId : 1}).all().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            "the employees company should not be loaded yet " : {

                topic : function(emps) {
                    assert.length(emps, 3);
                    assert.equal(1, emps[0].id);
                    assert.equal(2, emps[1].id);
                    assert.equal(3, emps[2].id);
                    emps[0].company.then(hitch(this, "callback", null));
                    emps[1].company.then(hitch(this, "callback", null));
                    emps[2].company.then(hitch(this, "callback", null));
                },

                "the company should not be null" : function(company) {
                    assert.isNotNull(company);
                },

                "the company name should be Google" : function(company) {
                    assert.equal(company.companyName, "Google");
                }

            }

        },

        teardown : function() {
            helper.dropModels();
        }
    });

    suite.run({reporter : require("vows/reporters/spec")});

});
