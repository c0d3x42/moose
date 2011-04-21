var vows = require('vows'),
        assert = require('assert'),
        helper = require("./data/oneToOne.eager.models"),
        moose = require("../lib"),
        comb = require("comb"),
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


            " the employee should work at google " : function(employee) {
                var works = employee.works;
                assert.equal(works.companyName, "Google");
                assert.equal(works.salary, 100000);
                return employee;
            }
        }

    });

    suite.addBatch({

        "When finding workers" : {
            topic : function() {
                Works.one().then(hitch(this, function(w) {
                    w.employee.then(hitch(this, "callback", null, w));
                }), hitch(this, "callback"));
            },


            " the worker should work at google and have an associated employee" : function(works) {
                var emp = works.employee;
                assert.equal(works.companyName, "Google");
                assert.equal(works.salary, 100000);
                assert.equal(emp.lastname, "last" + 1);
                assert.equal(emp.firstname, "first" + 1);
                assert.equal(emp.midinitial, "m");
                assert.equal(emp.gender, gender[1 % 2]);
                assert.equal(emp.street, "Street " + 1);
                assert.equal(emp.city, "City " + 1);
                return emp;
            }
        }

    });


    suite.addBatch({

        "When deleting an employee" : {
            topic : function() {
                Employee.one().chain(
                        function(e) {
                            return e.remove();
                        }).chain(hitch(Works, "count"), hitch(this, "callback")).then(hitch(this, "callback", null), hitch(this, "callback"));
            },


            " the the works count should be 0 " : function(count) {
                assert.equal(count, 0);
                helper.dropModels();
            }
        }

    });

    suite.run({reporter : require("vows/reporters/spec")});

});
