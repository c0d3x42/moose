var vows = require('vows'),
        assert = require('assert'),
        helper = require("./data/manyToMany.lazy.models"),
        moose = require("../lib"),
        comb = require("comb"),
        hitch = comb.hitch;

var gender = ["M", "F"];

helper.loadModels().then(function() {
    var Company = moose.getModel("company"), Employee = moose.getModel("employee"), CompanyEmployee = moose.getModel("companyEmployee");
    var suite = vows.describe("Many to Many lazy association ");
    suite.addBatch({

        "When creating a company with employees" : {
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
                            city : "City " + 1
                        },
                        {
                            lastname : "last" + 2,
                            firstname : "first" + 2,
                            midinitial : "m",
                            gender : gender[2 % 2],
                            street : "Street " + 2,
                            city : "City " + 2
                        }
                    ]
                });

                c1.save().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            " the company should have employees " : {
                topic : function(company) {
                    var emps = company.employees;
                    assert.length(emps, 2);
                    emps.forEach(function(emp, i) {
                        assert.ok((emp.id == i + 1));
                    });
                    return company;
                },

                " when querying the employees " : {
                    topic : function(company) {
                        Employee.filter({id : {"in" :  [1,2]}}).order("id").all().then(hitch(this, "callback", null), hitch(this, "callback"));
                    },

                    "the employees company should not be loaded yet" : {

                        topic : function(emps) {
                            assert.length(emps, 2);
                            assert.equal(1, emps[0].id);
                            assert.equal(2, emps[1].id);
                            emps[0].companies.then(hitch(this, "callback", null), hitch(this, "callback"));
                            emps[1].companies.then(hitch(this, "callback", null), hitch(this, "callback"));
                        },

                        " the company should not be null" : function(companies) {
                            assert.length(companies, 1);
                        },

                        " the company name should be Google" : function(companies) {
                            assert.equal(companies[0].companyName, "Google");
                        }

                    }
                }
            }
        }

    });

    suite.addBatch({

        "When finding a company" : {
            topic : function() {
                Company.one().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            " the companys employees should not be loaded " : {
                topic : function(company) {
                    company.employees.then(hitch(this, "callback", null), hitch(this, "callback"));
                },

                " but after fetching them there should be two" : function(emps) {
                    assert.length(emps, 2);
                    var ids = [2,1];
                    emps.forEach(function(emp, i) {
                        assert.equal(emp.id, ids[i]);
                    });
                }


            },

            " and adding an employee" : {
                topic : function(company) {
                    company.addEmployee(new Employee({
                        lastname : "last" + 3,
                        firstname : "first" + 3,
                        midinitial : "m",
                        gender : gender[1 % 3],
                        street : "Street " + 3,
                        city : "City " + 3
                    })).chain(hitch(company, "save"), hitch(this, "callback"))
                            .chain(hitch(company, "reload"), hitch(this, "callback"))
                            .chain(
                            function(company) {
                                return company.employees;
                            }, hitch(this, "callback")).then(hitch(this, "callback", null), hitch(this, "callback"));
                },

                "the company should have three employees " : function(emps) {
                    assert.length(emps, 3);
                    var ids = [3, 2,1];
                    emps.forEach(function(emp, i) {
                        assert.equal(emp.id, ids[i]);
                    });
                }
            }
        }

    });

    suite.addBatch({

        "When finding a company" : {
            topic : function() {
                Company.one().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            " and removing an employee" : {
                topic : function(company) {
                    //remove the last employee
                    //since there are three

                    company.removeEmployee(2)
                            .chain(hitch(company, "save"), hitch(this, "callback"))
                            .chain(function() {
                        return company.reload();
                    }, hitch(this, "callback"))
                            .then(hitch(this, function(newComp) {
                        newComp.employees.then(hitch(this, "callback", null), hitch(this, "callback"));
                    }), hitch(this, "callback"));
                },

                "the company should have two employees " : function(emps) {
                    assert.length(emps, 2);
                    var ids = [3,2];
                    emps.forEach(function(emp, i) {
                        assert.equal(emp.id, ids[i]);
                    });
                }
            }
        }

    });

    suite.addBatch({

        "When finding a company" : {
            topic : function() {
                Company.one().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            " and removing two more employees" : {
                topic : function(company) {
                    //remove the last employee
                    //since there are three
                    company.spliceEmployees(0, 2)
                            .chain(hitch(company, "save"), hitch(this, "callback"))
                            .chain(hitch(company, "reload"), hitch(this, "callback"))
                            .then(hitch(this, function(newComp) {
                        newComp.employees.then(hitch(this, "callback", null), hitch(this, "callback"));
                    }), hitch(this, "callback"));
                },

                "the company should have 0 employees " : function(emps) {
                    assert.length(emps, 0);
                }
            }
        }

    });

    suite.addBatch({

        "When finding a company" : {
            topic : function() {
                Company.one().then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            " and adding 3 employees" : {
                topic : function(company) {
                    //remove the last employee
                    //since there are three
                    company.addEmployees([
                        {
                            lastname : "last" + 1,
                            firstname : "first" + 1,
                            midinitial : "m",
                            gender : gender[1 % 2],
                            street : "Street " + 1,
                            city : "City " + 1
                        },
                        {
                            lastname : "last" + 2,
                            firstname : "first" + 2,
                            midinitial : "m",
                            gender : gender[2 % 2],
                            street : "Street " + 2,
                            city : "City " + 2
                        },
                        new Employee({
                            lastname : "last" + 3,
                            firstname : "first" + 3,
                            midinitial : "m",
                            gender : gender[1 % 3],
                            street : "Street " + 3,
                            city : "City " + 3
                        })
                    ]).chain(hitch(company, "save"), hitch(this, "callback"))
                            .chain(hitch(company, "reload"), hitch(this, "callback"))
                            .then(hitch(this, function(newComp) {
                        newComp.employees.then(hitch(this, "callback", null), hitch(this, "callback"));
                    }), hitch(this, "callback"));
                },


                "the company should have 3 employees " : function(emps) {
                    var ids = [6,5,4];
                    assert.length(emps, 3);
                    emps.forEach(function(emp, i) {
                        assert.equal(emp.id, ids[i]);
                    });
                }
            }
        }

    });

    suite.addBatch({
        "When deleting a company" : {
            topic : function() {
                Company.one().chain(
                        function(c) {
                            return c.remove();
                        }, hitch(this, "callback")).chain(hitch(Employee, "count"), hitch(this, "callback")).then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            " the there should still be 6 employees " : function(count) {
                assert.equal(count, 6);
                helper.dropModels();
            }
        }
    });


    suite.run({reporter : require("vows/reporters/spec")});

}, function(err) {
    console.log(err);
    throw err;
});



