var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../../lib"),
        mysql = require("mysql"),
        Mysql = moose.adapters.mysql,
        comb = require('comb'),
        ConnectionPool = Mysql.ConnectionPool;

var suite = vows.describe("Mysql connection pool");

suite.addBatch({
            "When creating a connection pool " : {
                topic : function() {
                    return  new ConnectionPool({user : "test", password : "testpass", database : 'test'});
                },

                " it should allow me to create a client " : function(topic) {
                    var conn = topic.getConnection().then(function(conn) {
                        assert.instanceOf(conn, mysql.Client);
                    });
                },

                "it should close all connections" : function(topic) {
                    topic.endAll().then(function(res) {
                        assert.length(res, 1);
                        assert.equal(res[0][0], 0);
                    });

                }
            }
        });

suite.addBatch({
            "When creating a connection pool with many connections" : {
                topic : function() {
                    return  new ConnectionPool({
                                user : "test",
                                password : "testpass",
                                database : 'test',
                                maxConnections : 3,
                                minConnection : 0
                            });
                },

                " it should allow me to retrieve three connections " : function(topic) {
                    topic.getConnection().then(function(conn) {
                        assert.instanceOf(conn, mysql.Client);
                    });
                    topic.getConnection().then(function(conn) {
                        assert.instanceOf(conn, mysql.Client);
                    });
                    topic.getConnection().then(function(conn) {
                        assert.instanceOf(conn, mysql.Client);
                    });
                },

                "it should close all connections" : function(topic) {
                    topic.endAll().then(function(res) {
                        assert.length(res, 3);
                        assert.equal(res[0][0], 0);
                    });

                }
            }
        });

suite.addBatch({
            "When creating a connection pool with many connections" : {
                topic : function() {
                    return  new ConnectionPool({
                                user : "test",
                                password : "testpass",
                                database : 'test',
                                maxConnections : 3,
                                minConnection : 0
                            });
                },

                " it should allow me to retrieve three connections" :  {
                    topic : function(pool) {
                        pool.getConnection().then(function(conn) {
                            assert.instanceOf(conn, mysql.Client);
                        });
                        pool.getConnection().then(function(conn) {
                            assert.instanceOf(conn, mysql.Client);
                        });
                        pool.getConnection().then(comb.hitch(this, function(conn) {
                            assert.instanceOf(conn, mysql.Client);
                            pool.getConnection().then(comb.hitch(this, "callback", null));
                            pool.returnConnection(conn);
                        }));
                    },

                    " and retrieve a fourth after returning one" : function(topic) {
                        assert.instanceOf(topic, mysql.Client);
                    }
                },

                "it should close all connections" : function(topic) {
                    topic.endAll().then(function(res) {
                        assert.length(res, 3);
                        assert.equal(res[0][0], 0);
                    });

                }
            }
        });

suite.run({reporter : require("vows/reporters/spec")});