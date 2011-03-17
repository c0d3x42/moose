var vows = require('vows'),
        assert = require('assert'),
        tables = require("./tables/oneToOne.table"),
        employee = tables.employee,
        works = tables.works,
        moose = require("../lib"),
        hitch = moose.hitch;

moose.createConnection({user : "root",database : 'test'});
var Employee = moose.addModel(employee);
var Works = moose.addModel(works);

//define associations
Employee.oneToOne("works", {model : Works.tableName, fetchType : Employee.fetchType.EAGER, key : {eid : "eid"}});
Works.manyToOne("employee", {model : Employee.tableName, key : {eid : "eid"}});

var gender = ["M", "F"];

moose.refresh([works, employee]).then(function() {
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
                }).save().then(hitch(this, "callback", null));
            },

            " the employee should work at google " : function(employee) {
                var works = employee.works;
                console.log(works.companyName);
                assert.equal(works.companyName, "Google");
                assert.equal(works.salary, 100000);
                return employee
            }
        }

    });

    suite.addBatch({

        "When finding an employee" : {
            topic : function() {
                Employee.one().then(hitch(this, "callback", null));
            },


            " the employee should work at google " : function(employee) {
                var works = employee.works;
                assert.equal(works.companyName, "Google");
                assert.equal(works.salary, 100000);
                return employee
            }
        }

    });

    suite.addBatch({

        "When finding workers" : {
            topic : function() {
                Works.one().then(hitch(this, function(w){
                    w.employee.then(hitch(this, "callback", null, w));
                }), hitch(this, "callback"))
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
                return employee
            }
        }

    });


    suite.addBatch({

        "When deleting an employee" : {
            topic : function() {
                Employee.one().chain(
                        function(e) {
                            return e.remove();
                        }).chain(hitch(Works, "count")).then(hitch(this, "callback", null));
            },


            " the the works count should be 0 " : function(count) {
                assert.equal(count, 0);
            }
        }

    });

    suite.run({reporter : require("vows/reporters/spec")});

});
