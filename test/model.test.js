var vows = require('vows'),
        assert = require('assert'),
        helper = require("./data/model.models"),
        moose = require("../lib"),
        hitch = moose.hitch;

var suite = vows.describe("model object");


helper.loadModels().then(function() {
    var Employee = moose.getModel("employee");
    suite.addBatch({
        "Should check if an object is valid" : {
            topic : function() {
                return Employee
            },

            "and be true" : function(topic) {
                var val = {
                    id : 1,
                    firstname : "doug",
                    lastname : "martin",
                    midinitial : null,
                    gender : "M",
                    street : "1 nowhere st.",
                    city : "NOWHERE"
                };
                assert.isTrue(topic.isValid(val));
            },

            "and be false" : function(topic) {
                var val = {
                    id : "1",
                    firstname : true,
                    lastname : false,
                    midinitial : "AA",
                    gender : "Z",
                    street : new Date(),
                    city : new Date()
                };
                assert.isFalse(topic.isValid(val));
            }
        },

        "Should check if an object is valid when creating a new model" : {
            topic : function() {
                return Employee;
            },

            "and be true" : function(topic) {
                var val = {
                    id : 1,
                    firstname : "doug",
                    lastname : "martin",
                    midinitial : null,
                    gender : "M",
                    street : "1 nowhere st.",
                    city : "NOWHERE"
                };
                assert.doesNotThrow(function() {
                    new topic(val);
                });
            },

            "and be false" : function(topic) {
                var val = {
                    id : "1",
                    firstname : true,
                    lastname : false,
                    midinitial : "AA",
                    gender : "Z",
                    street : new Date(),
                    city : new Date()
                };
                assert.throws(function() {
                    new topic(val);
                });
            }
        }
    });
    suite.addBatch({
        "should save an employee" : {
            topic : function() {
                var emp = new Employee({
                    firstname : "doug",
                    lastname : "martin",
                    midinitial : null,
                    gender : "M",
                    street : "1 nowhere st.",
                    city : "NOWHERE"}).save().then(hitch(Employee, "all", hitch(this, "callback", null)));
            },

            " and get a list of one employees" : function(t) {
                assert.length(t, 1);
                console.log(t);
                var emp = t[0];
                assert.instanceOf(emp, Employee);
                assert.equal("doug", emp.firstname);
                assert.equal("martin", emp.lastname);
                assert.isNull(emp.midinitial);
                assert.equal("M", emp.gender);
                assert.equal("1 nowhere st.", emp.street);
                assert.equal("NOWHERE", emp.city);
            }


        }
    });

    suite.addBatch({
        "should save a batch of employees" : {
            topic : function() {
                var emps = [];
                var gender = ["M", "F"];
                for (var i = 0; i < 20; i++) {
                    emps.push({
                        lastname : "last" + i,
                        firstname : "first" + i,
                        midinitial : "m",
                        gender : gender[i % 2],
                        street : "Street " + i,
                        city : "City " + i
                    });
                }
                var emp = Employee.save(emps).then(hitch(Employee, "count", hitch(this, "callback", null), null));
            },

            " and get a get a count of 21" : function(count) {
                assert.equal(count, 21);
            }


        }
    });

    suite.addBatch({
        "Should filter"  : {
            topic : function() {
                var self = this;
                var d = Employee.filter({id : [1,2,3,4,5,6]}).all(hitch(this, "callback", null), function(err) {
                    console.log(err);
                });
            },

            "and return employees" : function(topic) {
                var i = 1;
                assert.length(topic, 6);
                topic.forEach(function(t) {
                    assert.instanceOf(t, Employee);
                    assert.equal(i++, t.id);
                });
            }
        },

        "Should find by gender"  : {
            topic : function() {
                var self = this;
                var d = Employee.findByGender("F", hitch(this, "callback", null));
            },

            "and return female employees" : function(topic) {
                topic.forEach(function(emp) {
                    assert.instanceOf(emp, Employee);
                    assert.equal("F", emp.gender);
                });
            }
        },

        "Should count employees"  : {
            topic : function() {
                var self = this;
                var d = Employee.count(hitch(this, "callback", null));
            },

            "and return 21" : function(topic) {
                assert.equal(21, topic);
            }
        },

        "Should find all employees"  : {
            topic : function() {
                var self = this;
                var d = Employee.all(hitch(this, "callback", null));
            },

            "and return 21 employees" : function(topic) {
                assert.length(topic, 21);
                topic.forEach(function(e) {
                    assert.instanceOf(e, Employee);
                })
            }
        },

        "Should loop through all employees"  : {
            topic : function() {
                var self = this;
                this.count = 1;
                var d = Employee.forEach(hitch(this, "callback", null));
            },

            "and return 21 employees" : function(topic) {
                assert.instanceOf(topic, Employee);
                assert.equal(this.count++, topic.id);
            }
        },

        "Should find first employee"  : {
            topic : function() {
                var self = this;
                this.count = 1;
                var d = Employee.one(hitch(this, "callback", null));
            },

            "and return employee with id of 1" : function(topic) {
                assert.instanceOf(topic, Employee);
                assert.equal(1, topic.id);
            }
        },

        "Should find last employee"  : {
            topic : function() {
                var self = this;
                this.count = 1;
                var d = Employee.last(hitch(this, "callback", null));
            },

            "and return employee with id of 21" : function(topic) {
                assert.instanceOf(topic, Employee);
                //assert.equal(21, topic.id);
            }
        },


        "Should find all employees with query"  : {
            topic : function() {
                var self = this;
                var d = Employee.all({id : [1,2,3,4,5,6]}, hitch(this, "callback", null));
            },

            "and return 6 employees" : function(topic) {
                assert.length(topic, 6);
                topic.forEach(function(e, i) {
                    assert.instanceOf(e, Employee);
                    assert.equal(i + 1, e.id);
                })
            }
        },

        "Should loop through all employees with query"  : {
            topic : function() {
                var self = this;
                this.count = 1;
                var d = Employee.forEach({id : [1,2,3,4,5,6]}, hitch(this, "callback", null));
            },

            "and return 6 employees" : function(topic) {
                var ids = [1,2,3,4,5,6]
                assert.instanceOf(topic, Employee);
                assert.isTrue(ids.indexOf(topic.id) != -1);
            }
        },

        "Should find first employee with query"  : {
            topic : function() {
                var self = this;
                this.count = 1;
                var d = Employee.one({id : {gt : 5, lt : 11}}, hitch(this, "callback", null));
            },

            "and return employee with id of 1" : function(topic) {
                assert.instanceOf(topic, Employee);
                assert.equal(topic.id, 6);
            }
        },

        "Should find last employee with query"  : {
            topic : function() {
                var self = this;
                this.count = 1;
                var d = Employee.last({id : {gt : 5, lt : 11}}, hitch(this, "callback", null));
            },

            "and return employee with id of 21" : function(topic) {
                assert.instanceOf(topic, Employee);
                assert.equal(10, topic.id);
            }
        }
    });
    suite.addBatch({
        "Should save an employee"  : {
            topic : function() {
                this.count = 1;
                Employee.save({
                    firstname : "doug",
                    lastname : "martin",
                    midinitial : null,
                    gender : "M",
                    street : "1 nowhere st.",
                    city : "NOWHERE"
                }).then(hitch(this, "callback", null));
            },

            "and the employee should have an id" : function(emp) {
                assert.instanceOf(emp, Employee);
                assert.isNumber(emp.id);
            },

            "Should be able to update the employee" : {
                topic : function(emp) {
                    emp.firstname = "doug";
                    emp.update().then(hitch(this, "callback", null));
                },

                "and when querying the employee it should be updated" : {

                    topic : function(e, emp) {
                        Employee.one({id : emp.id}).then(hitch(this, "callback", null));
                    },

                    " with the new name" : function(emp) {
                        assert.instanceOf(emp, Employee);
                        assert.isNumber(emp.id);
                        assert.equal(emp.firstname, "doug");
                    },

                    "Should be able to delete the employee" :  {
                        topic : function(e, emp) {
                            self = this;
                            emp.remove().then(function() {
                                self.callback(null, emp);
                            });
                        },

                        "and when when querying the deleted employee" : {

                            topic : function(emp1, emp) {
                                var self = this;
                                Employee.one({id : emp.id}, function(results) {
                                    self.callback(null, results);
                                });
                            },

                            "it should be null" : function(topic) {
                                assert.isNull(topic);
                            }
                        }
                    }
                }

            }
        }
    });

    suite.addBatch({
        "Should do a batch update" : {
            topic : function() {
                Employee.update({firstname : "doug"}, hitch(this, function() {
                    Employee.all(hitch(this, "callback", null));
                }));
            },

            " all records should be updated" : function(records) {
                assert.length(records, 21);
                records.forEach(function(r) {
                    assert.equal(r.firstname, "doug");
                })
            }
        }
    });

    suite.addBatch({
        "Should do an update on a single record" : {
            topic : function() {
                Employee.update({firstname : "dougie"}, {id : 2}, hitch(this, function() {
                    Employee.filter({id : 2}).one(hitch(this, "callback", null));
                }));
            },

            " all records should be updated" : function(emp) {
                assert.instanceOf(emp, Employee);
                assert.equal(emp.firstname, "dougie");
            }
        }
    });
    suite.run({reporter : require("vows/reporters/spec")});
}, function(err){console.log(err)});


