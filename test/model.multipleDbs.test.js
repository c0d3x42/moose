var vows = require('vows'),
		assert = require('assert'),
		helper = require("./data/model.multipleDatabase"),
		moose = require("../lib"),
		comb = require("comb"),
		hitch = comb.hitch;

var suite = vows.describe("Model object with multple databases");


helper.loadModels().then(function() {
	var Employee = moose.getModel("employee");
	//Get employee from other database
	var Employee2 = moose.getModel("employee", "test2");
	suite.addBatch({
				"Test database model should check if an object is valid" : {
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
				"Test2 database model should check if an object is valid" : {
					topic : function() {
						return Employee2;
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
						return Employee2;
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
				"should save an employee into test database " : {
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
				"should save an employee into test2 database " : {
					topic : function() {
						var emp = new Employee2({
									firstname : "doug2",
									lastname : "martin2",
									midinitial : null,
									gender : "M",
									street : "2 nowhere st.",
									city : "NOWHERE2"}).save().then(hitch(Employee2, "all", hitch(this, "callback", null)));
					},

					" and get a list of one employees" : function(t) {
						assert.length(t, 1);
						var emp = t[0];
						assert.instanceOf(emp, Employee2);
						assert.equal("doug2", emp.firstname);
						assert.equal("martin2", emp.lastname);
						assert.isNull(emp.midinitial);
						assert.equal("M", emp.gender);
						assert.equal("2 nowhere st.", emp.street);
						assert.equal("NOWHERE2", emp.city);
					}


				}
			});

	suite.addBatch({
				"should save a batch of employees into test" : {
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
				"should save a batch of employees into test2" : {
					topic : function() {
						var emps = [];
						var gender = ["M", "F"];
						for (var i = 20; i < 40; i++) {
							emps.push({
										lastname : "last" + i,
										firstname : "first" + i,
										midinitial : "m",
										gender : gender[i % 2],
										street : "Street " + i,
										city : "City " + i
									});
						}
						var emp = Employee2.save(emps).then(hitch(Employee2, "count", hitch(this, "callback", null), null));
					},

					" and get a get a count of 21" : function(count) {
						assert.equal(count, 21);
					}


				}
			});

	suite.addBatch({
				"Should filter employees in the test db "  : {
					topic : function() {
						var self = this;
						var d = Employee.filter({id : [1,2,3,4,5,6]}).all(hitch(this, "callback", null), hitch(this, "callback"));
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

				"Should find by gender  in the test db "  : {
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

				"Should count employees in the test db "  : {
					topic : function() {
						var self = this;
						var d = Employee.count(hitch(this, "callback", null));
					},

					"and return 21" : function(topic) {
						assert.equal(21, topic);
					}
				},

				"Should find all employees  in the test db "  : {
					topic : function() {
						var self = this;
						var d = Employee.all().then(hitch(this, "callback", null), hitch(this, "callback"));
						;
					},

					"and return 21 employees" : function(topic) {
						assert.length(topic, 21);
						topic.forEach(function(e) {
							assert.instanceOf(e, Employee);
						});
					}
				},

				"Should loop through all employees  in the test db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee.forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
					},

					"and return 21 employees" : function(topic) {
						assert.instanceOf(topic, Employee);
						assert.equal(this.count++, topic.id);
					}
				},

				"Should find first employee  in the test db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee.one().then(hitch(this, "callback", null), hitch(this, "callback"));
						;
					},

					"and return employee with id of 1" : function(topic) {
						assert.instanceOf(topic, Employee);
						assert.equal(1, topic.id);
					}
				},

				"Should find last employee  in the test db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee.last().then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return employee with id of 21" : function(topic) {
						assert.instanceOf(topic, Employee);
						//assert.equal(21, topic.id);
					}
				},


				"Should find all employees with query  in the test db "  : {
					topic : function() {
						var self = this;
						var d = Employee.all({id : [1,2,3,4,5,6]}).then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return 6 employees" : function(topic) {
						assert.length(topic, 6);
						topic.forEach(function(e, i) {
							assert.instanceOf(e, Employee);
							assert.equal(i + 1, e.id);
						});
					}
				},

				"Should loop through all employees with query  in the test db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee.forEach({id : [1,2,3,4,5,6]}, hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
					},

					"and return 6 employees" : function(topic) {
						var ids = [1,2,3,4,5,6];
						assert.instanceOf(topic, Employee);
						assert.isTrue(ids.indexOf(topic.id) != -1);
					}
				},

				"Should find first employee with query  in the test db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee.one({id : {gt : 5, lt : 11}}).then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return employee with id of 1" : function(topic) {
						assert.instanceOf(topic, Employee);
						assert.equal(topic.id, 6);
					}
				},

				"Should find last employee with query  in the test db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee.filter({id : {gt : 5, lt : 11}}).last().then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return employee with id of 21" : function(topic) {
						assert.instanceOf(topic, Employee);
						assert.equal(10, topic.id);
					}
				}
			});

	suite.addBatch({
				"Should filter in the test2 db "  : {
					topic : function() {
						var self = this;
						var d = Employee2.filter({id : [1,2,3,4,5,6]}).all(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return employees" : function(topic) {
						var i = 1;
						assert.length(topic, 6);
						topic.forEach(function(t) {
							assert.instanceOf(t, Employee2);
							assert.equal(i++, t.id);
						});
					}
				},

				"Should find by gender the test2 db "  : {
					topic : function() {
						var self = this;
						var d = Employee2.findByGender("F", hitch(this, "callback", null));
					},

					"and return female employees" : function(topic) {
						topic.forEach(function(emp) {
							assert.instanceOf(emp, Employee2);
							assert.equal("F", emp.gender);
						});
					}
				},

				"Should count employees the test2 db "  : {
					topic : function() {
						var self = this;
						var d = Employee2.count(hitch(this, "callback", null));
					},

					"and return 21" : function(topic) {
						assert.equal(21, topic);
					}
				},

				"Should find all employees the test2 db "  : {
					topic : function() {
						var self = this;
						var d = Employee2.all().then(hitch(this, "callback", null), hitch(this, "callback"));
						;
					},

					"and return 21 employees" : function(topic) {
						assert.length(topic, 21);
						topic.forEach(function(e) {
							assert.instanceOf(e, Employee2);
						});
					}
				},

				"Should loop through all employees the test2 db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee2.forEach(hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
					},

					"and return 21 employees" : function(topic) {
						assert.instanceOf(topic, Employee2);
						assert.equal(this.count++, topic.id);
					}
				},

				"Should find first employee the test2 db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee2.one().then(hitch(this, "callback", null), hitch(this, "callback"));
						;
					},

					"and return employee with id of 1" : function(topic) {
						assert.instanceOf(topic, Employee2);
						assert.equal(1, topic.id);
					}
				},

				"Should find last employee the test2 db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee2.last().then(hitch(this, "callback", null), hitch(this, "callback"));
						;
					},

					"and return employee with id of 21" : function(topic) {
						assert.instanceOf(topic, Employee2);
						//assert.equal(21, topic.id);
					}
				},


				"Should find all employees with query the test2 db "  : {
					topic : function() {
						var self = this;
						var d = Employee2.all({id : [1,2,3,4,5,6]}).then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return 6 employees" : function(topic) {
						assert.length(topic, 6);
						topic.forEach(function(e, i) {
							assert.instanceOf(e, Employee2);
							assert.equal(i + 1, e.id);
						});
					}
				},

				"Should loop through all employees with query the test2 db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee2.forEach({id : [1,2,3,4,5,6]}, hitch(this, "callback", null)).addErrback(hitch(this, "callback"));
					},

					"and return 6 employees" : function(topic) {
						var ids = [1,2,3,4,5,6];
						assert.instanceOf(topic, Employee2);
						assert.isTrue(ids.indexOf(topic.id) != -1);
					}
				},

				"Should find first employee with query the test2 db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee2.one({id : {gt : 5, lt : 11}}).then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return employee with id of 1" : function(topic) {
						assert.instanceOf(topic, Employee2);
						assert.equal(topic.id, 6);
					}
				},

				"Should find last employee with query the test2 db "  : {
					topic : function() {
						var self = this;
						this.count = 1;
						var d = Employee2.filter({id : {gt : 5, lt : 11}}).last().then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and return employee with id of 21" : function(topic) {
						assert.instanceOf(topic, Employee2);
						assert.equal(10, topic.id);
					}
				}
			});

	suite.addBatch({
				"Should save an employee the test db "  : {
					topic : function() {
						this.count = 1;
						Employee.save({
									firstname : "doug",
									lastname : "martin",
									midinitial : null,
									gender : "M",
									street : "1 nowhere st.",
									city : "NOWHERE"
								}).then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and the employee should have an id" : function(emp) {
						assert.instanceOf(emp, Employee);
						assert.isNumber(emp.id);
					},

					"Should be able to update the employee" : {
						topic : function(emp) {
							emp.firstname = "doug";
							emp.update().then(hitch(this, "callback", null), hitch(this, "callback"));
						},

						"and when querying the employee it should be updated" : {

							topic : function(e, emp) {
								Employee.one({id : emp.id}).then(hitch(this, "callback", null), hitch(this, "callback"));
							},

							" with the new name" : function(emp) {
								assert.instanceOf(emp, Employee);
								assert.isNumber(emp.id);
								assert.equal(emp.firstname, "doug");
							},

							"Should be able to delete the employee" :  {
								topic : function(e, emp) {
									self = this;
									emp.remove().then(hitch(this, "callback", null, emp), hitch(this, "callback"));
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
				"Should save an employee the test2 db "  : {
					topic : function() {
						this.count = 1;
						Employee2.save({
									firstname : "doug2",
									lastname : "martin2",
									midinitial : null,
									gender : "M",
									street : "2 nowhere st.",
									city : "NOWHERE2"
								}).then(hitch(this, "callback", null), hitch(this, "callback"));
					},

					"and the employee should have an id" : function(emp) {
						assert.instanceOf(emp, Employee2);
						assert.isNumber(emp.id);
					},

					"Should be able to update the employee" : {
						topic : function(emp) {
							emp.firstname = "doug2";
							emp.update().then(hitch(this, "callback", null), hitch(this, "callback"));
						},

						"and when querying the employee it should be updated" : {

							topic : function(e, emp) {
								Employee2.one({id : emp.id}).then(hitch(this, "callback", null), hitch(this, "callback"));
							},

							" with the new name" : function(emp) {
								assert.instanceOf(emp, Employee2);
								assert.isNumber(emp.id);
								assert.equal(emp.firstname, "doug2");
							},

							"Should be able to delete the employee" :  {
								topic : function(e, emp) {
									self = this;
									emp.remove().then(hitch(this, "callback", null, emp), hitch(this, "callback"));
								},

								"and when when querying the deleted employee" : {

									topic : function(emp1, emp) {
										var self = this;
										Employee2.one({id : emp.id}, function(results) {
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
				"Should do a batch update in the test db" : {
					topic : function() {
						Employee.update({firstname : "doug"}, hitch(this, function() {
							Employee.all(hitch(this, "callback", null));
						}));
					},

					" all records should be updated" : function(records) {
						assert.length(records, 21);
						records.forEach(function(r) {
							assert.equal(r.firstname, "doug");
						});
					}
				}
			});

	suite.addBatch({
				"Should do a batch update in the test2 db" : {
					topic : function() {
						Employee2.update({firstname : "doug2"}, hitch(this, function() {
							Employee2.all(hitch(this, "callback", null));
						}));
					},

					" all records should be updated" : function(records) {
						assert.length(records, 21);
						records.forEach(function(r) {
							assert.equal(r.firstname, "doug2");
						});
					}
				}
			});

	suite.addBatch({
				"Should do an update on a single record in the test db" : {
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

	suite.addBatch({
				"Should do an update on a single record in the test2 db" : {
					topic : function() {
						Employee2.update({firstname : "dougie2"}, {id : 2}, hitch(this, function() {
							Employee2.filter({id : 2}).one(hitch(this, "callback", null));
						}));
					},

					" all records should be updated" : function(emp) {
						assert.instanceOf(emp, Employee2);
						assert.equal(emp.firstname, "dougie2");
						helper.dropModels();
					}
				}
			});


	suite.run({reporter : require("vows/reporters/spec")});
}, function(err) {
	throw err;
});


