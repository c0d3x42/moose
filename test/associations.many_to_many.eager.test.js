var vows = require('vows'),
        assert = require('assert'),
        tables = require("./tables/manyToMany.table"),
        employee = tables.employee,
        company = tables.company,
        companyEmployee = tables.companyEmployee,
        moose = require("../lib"),
        hitch = moose.hitch;

moose.createConnection({user : "root",database : 'test'});
var Employee = moose.addModel(employee);
var Company = moose.addModel(company);
var CompanyEmployee = moose.addModel(companyEmployee);

//define associations
Employee.manyToMany("companies", {
    model : Company.tableName,
    joinTable : CompanyEmployee.tableName,
    key : {employeeId : "companyId"}
});
Company.manyToMany("employees", {
    model : Employee.tableName,
    orderBy : {id : "desc"},
    fetchType : Company.fetchType.EAGER,
    joinTable : CompanyEmployee.tableName,
    key : {companyId : "employeeId"}
});

var gender = ["M", "F"];

moose.refresh([companyEmployee, employee, company]).then(function() {
    var suite = vows.describe("Many to Many Eager association ");

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

                c1.save().then(hitch(this, function(c) {
                    this.callback(null, c);
                }));
            },

            " the company should have employees " : {
                topic : function(company) {
                    var emps = company.employees;
                    assert.length(emps, 2);
                    emps.forEach(function(emp, i) {
                        assert.equal(emp.id, i + 1);
                    });
                    return company
                },

                " when querying the employees " : {
                    topic : function(company) {
                        Employee.filter({id : {"in" :  [1,2]}}).order("id").all().then(hitch(this, "callback", null));
                    },

                    "the employees company should not be loaded yet" : {

                        topic : function(emps) {
                            assert.length(emps, 2);
                            assert.equal(1, emps[0].id);
                            assert.equal(2, emps[1].id);
                            emps[0].companies.then(hitch(this, "callback", null));
                            emps[1].companies.then(hitch(this, "callback", null));
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
                Company.one().then(hitch(this, "callback", null));
            },

            " the company should have employees " : function(company) {
                var emps = company.employees;
                assert.length(emps, 2);
                var ids = [2,1]
                emps.forEach(function(emp, i) {
                    assert.equal(ids[i], emp.id);
                });
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
                    })).save().chain(hitch(company, "reload")).then(hitch(this, "callback", null));
                },

                "the company should have three employees " : function(company) {
                    var emps = company.employees;
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
                Company.one().then(hitch(this, "callback", null));
            },

            " the company should have employees " : function(company) {
                var emps = company.employees;
                assert.length(emps, 3);
                ids = [3,2,1]
                emps.forEach(function(emp, i) {
                    assert.equal(ids[i], emp.id);
                });
            },

            " and removing an employee" : {
                topic : function(company) {
                    //remove the last employee
                    //since there are three
                    company.removeEmployee(2).save().chain(hitch(company, "reload"), hitch(this, "callback")).then(hitch(this, "callback", null), hitch(this, "callback"));
                },

                "the company should have two employees " : function(company) {
                    var emps = company.employees;
                    assert.length(emps, 2);
                    var ids = [3,2]
                    emps.forEach(function(emp, i) {
                        assert.equal(ids[i], emp.id);
                    });
                }
            }
        }

    });

    suite.addBatch({

        "When finding a company" : {
            topic : function() {
                Company.one().then(hitch(this, "callback", null));
            },

            " the company should have employees " : function(company) {
                var emps = company.employees;
                assert.length(emps, 2);
                ids = [3,2]
                emps.forEach(function(emp, i) {
                    assert.equal(ids[i], emp.id);
                });
            },

            " and removing an employee" : {
                topic : function(company) {
                    //remove the last employee
                    //since there are three
                    company.spliceEmployees(0, 2).save().chain(hitch(company, "reload")).then(hitch(this, "callback", null));
                },

                "the company should have 0 employees " : function(company) {
                    var emps = company.employees;
                    assert.length(emps, 0);
                }
            }
        }

    });

    suite.addBatch({
        "When finding a company" : {
            topic : function() {
                Company.one().then(hitch(this, "callback", null));
            },

            " the company should no employees " : function(company) {
                var emps = company.employees;
                assert.length(emps, 0);
            },

            " and add an employees" : {
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
                    ]).save().chain(hitch(company, "reload")).then(hitch(this, "callback", null));
                },

                "the company should have 3 employees " : function(company) {
                    var emps = company.employees;
                    var ids = [6,5,4]
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
                        }).chain(hitch(Employee, "count")).then(hitch(this, "callback", null));
            },

            " the employees should still exits " : function(count) {
                assert.equal(count, 6);
            }
        }
    });


    suite.run({reporter : require("vows/reporters/spec")});

});

