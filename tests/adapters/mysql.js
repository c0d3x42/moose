var vows = require('vows'),
    assert = require('assert'),
    mysql = require("../../lib/adapters").mysql,
    Client = require('mysql').Client,
    db = new Client();
// Create a Test Suite
vows.describe('mysql gt operation').addBatch({
    'when finding a number > zero': {
        topic: function () { return mysql.gt({x : 0}, db)},

        'we get ': function (topic) {
            assert.equal (topic, "x > 0");
        }
    }
}).run(); // Run it

vows.describe('mysql gte operation').addBatch({
    'when finding a number >= to zero': {
        topic: function () { return mysql.gte({x : 0}, db)},

        'we get ': function (topic) {
            assert.equal (topic, "x >= 0");
        }
    }
}).run(); // Run it

vows.describe('mysql lt operation').addBatch({
    'when finding a number < one': {
        topic: function () { return mysql.lt({x : 1}, db)},

        'we get ': function (topic) {
            assert.equal (topic, "x < 1");
        }
    }
}).run(); // Run it

vows.describe('mysql lte operation').addBatch({
    'when finding a number <= to one': {
        topic: function () { return mysql.lte({x : 1}, db)},

        'we get ': function (topic) {
            assert.equal (topic, "x <= 1");
        }
    }
}).run(); // Run it


vows.describe('mysql find operation').addBatch({
    'when finding a number > zero': {
        topic: function () { return mysql.find({x : {gt : 0}}, "test", db)},

        'we get ': function (topic) {
            assert.equal (topic, "select * from test where x > 0");
        }
    },
    'when finding a number >= to 0': {
        topic: function () { return mysql.find({x : {gte : 0}}, "test", db)},

        'we get ': function (topic) {
            assert.equal (topic, "select * from test where x >= 0");
        }
    },

    'when finding a number < 1': {
        topic: function () { return mysql.find({x : {lt : 1}}, "test", db)},

        'we get ': function (topic) {
            assert.equal (topic, "select * from test where x < 1");
        }
    },

    'when finding a number <= to 1': {
        topic: function () { return mysql.find({x : {lte : 1}}, "test", db)},

        'we get ': function (topic) {
            assert.equal (topic, "select * from test where x <= 1");
        }
    },

    'when finding x <= to 1 and  y >= to 1': {
        topic: function () { return mysql.find({x : {lte : 1}, y : {gte : 1}}, "test", db)},

        'we get ': function (topic) {
            assert.equal (topic, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding x > 0 and  y >= 1 z < 1 k <= 1': {
        topic: function () { return mysql.find({x : {gt : 0}, y : {gte : 1}, z : {lt : 1}, k : {lte : 1}}, "test", db)},

        'we get ': function (topic) {
            assert.equal (topic, "select * from test where x > 0 and y >= 1 and z < 1 and k <= 1");
        }
    }
}).run(); // Run it