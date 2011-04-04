var vows = require('vows'),
        assert = require('assert'),
        moose = require("../lib"),
        sql = require("./data/dataset").sql;


/*options : Object
 *  options.connection : @see moose.createConnection
 *  options.dir : name of directory where migrations are located
 *  options.up : boolen, if true will migrate up otherwise down
 *  options.start : the migration to start at
 *  options.end : the migration to end at*/


var SHOW_TABLES = 'SHOW TABLES'

var suite = vows.describe('mysql adapter');

suite.addBatch({
    "when migrating just the first migration " : {
        topic : function() {
            var options = {
                connection : {user : "test", password : "testpass", database : 'test'},
                dir : "./data/migrations/migrations",
                start : 0,
                end : 0,
                up : true
            };
            moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
        },

        "and showing tables" :{
            topic : function(res) {
                moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            "only company should be created" : {
                topic : function(res) {
                    assert.length(res, 1);
                    res = res[0];
                    assert.isNotNull(res.Tables_in_test);
                    assert.equal(res.Tables_in_test, "company");
                    return res;
                },

                "when migrating down one file" : {
                    topic : function() {
                        var options = {
                            connection : {user : "test", password : "testpass", database : 'test'},
                            dir : "./data/migrations/migrations",
                            start : 0,
                            end : 0,
                            up : false
                        };
                        moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
                    },

                    "and showing tables" :{
                        topic : function(res) {
                            moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
                        },

                        "the result should be empty" : function(res) {
                            assert.isNotNull(res.Tables_in_test);
                            assert.length(res, 0);
                        }

                    }
                }
            }
        }
    }
});

suite.addBatch({
    "when migrating just the second migraton " : {
        topic : function() {
            var options = {
                connection : {user : "test", password : "testpass", database : 'test'},
                dir : "./data/migrations/migrations",
                start : 1,
                end : 1,
                up : true
            };
            moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
        },

        "and showing tables " :{
            topic : function(res) {
                moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            "only employee should be created " : {
                topic : function(res) {
                    assert.length(res, 1);
                    res = res[0];
                    assert.isNotNull(res.Tables_in_test);
                    assert.equal(res.Tables_in_test, "employee");
                    return res;
                },

                "when migrating down one file " : {
                    topic : function() {
                        var options = {
                            connection : {user : "test", password : "testpass", database : 'test'},
                            dir : "./data/migrations/migrations",
                            start : 1,
                            end : 1,
                            up : false
                        };
                        moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
                    },

                    "and showing tables " :{
                        topic : function(res) {
                            moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
                        },

                        "the result should be empty" : function(res) {
                            assert.isNotNull(res.Tables_in_test);
                            assert.length(res, 0);
                        }

                    }
                }
            }
        }
    }
});

suite.addBatch({
    "when migrating just two migrations " : {
        topic : function() {
            var options = {
                connection : {user : "test", password : "testpass", database : 'test'},
                dir : "./data/migrations/migrations",
                start : 0,
                end : 1,
                up : true
            };
            moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
        },

        "and showing tables" :{
            topic : function(res) {
                moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            "only employee and company should be created" : {
                topic : function(res) {
                    assert.length(res, 2);
                    var resOne = res[0];
                    var resTwo = res[1];
                    assert.equal(resOne.Tables_in_test, "company");
                    assert.equal(resTwo.Tables_in_test, "employee");
                    return res;
                },

                "when migrating down one file" : {
                    topic : function() {
                        var options = {
                            connection : {user : "test", password : "testpass", database : 'test'},
                            dir : "./data/migrations/migrations",
                            start : 0,
                            end : 1,
                            up : false
                        };
                        moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
                    },

                    "and showing tables" :{
                        topic : function(res) {
                            moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
                        },

                        "the result should be empty" : function(res) {
                            assert.isNotNull(res.Tables_in_test);
                            assert.length(res, 0);
                        }

                    }
                }
            }
        }
    }
});

suite.addBatch({
    "when migrating through four " : {
        topic : function() {
            var options = {
                connection : {user : "test", password : "testpass", database : 'test'},
                dir : "./data/migrations/migrations",
                start : 0,
                end : 3,
                up : true
            };
            moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
        },

        "and showing tables" :{
            topic : function(res) {
                moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
            },

            "only employee and company should be created" : {
                topic : function(res) {
                    assert.length(res, 4);
                    ["company", "companyEmployee", "employee", "works"].forEach(function(table, i) {
                        assert.equal(res[i].Tables_in_test, table);
                    });

                    return res;
                },

                "when applying the fourth file" : {
                    topic : function() {
                        var options = {
                            connection : {user : "test", password : "testpass", database : 'test'},
                            dir : "./data/migrations/migrations",
                            start : 4,
                            end : 4,
                            up : true
                        };
                        moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
                    },

                    "and showing tables" :{
                        topic : function(res) {
                            moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
                        },

                        "the result should be empty" : function(res) {
                            ["companyEmployee", "companyNew", "employee", "works"].forEach(function(table, i) {
                                assert.equal(res[i].Tables_in_test, table);
                            });
                        },

                        "when rolling back the changes " : {
                            topic : function() {
                                var options = {
                                    connection : {user : "test", password : "testpass", database : 'test'},
                                    dir : "./data/migrations/migrations",
                                    start : 0,
                                    end : 4,
                                    up : false
                                };
                                moose.migrate(options).then(hitch(this, "callback", null), hitch(this, "callback"));
                            },

                            "and showing tables" :{
                                topic : function(res) {
                                    moose.execute(SHOW_TABLES).then(hitch(this, "callback", null), hitch(this, "callback"));
                                },

                                "the result should be empty" : function(res) {
                                    assert.isNotNull(res.Tables_in_test);
                                    assert.length(res, 0);
                                }

                            }
                        }
                    }
                }
            }
        }
    }
});


suite.run({reporter : require("vows/reporters/spec")});




