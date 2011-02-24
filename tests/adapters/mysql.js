var vows = require('vows'),
    assert = require('assert'),
    Mysql = require("../../lib/adapters").mysql,
    Client = require('mysql').Client,
    db = new Client();
// Create a Test Suite
vows.describe('mysql gt operation').addBatch({
    'when finding a number > zero': {
        topic: function () { return new Mysql("test", db).gt({x : 0})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x > 0");
        }
    }
}).run(); // Run it

vows.describe('mysql gte operation').addBatch({
    'when finding a number >= to zero': {
        topic: function () { return new Mysql("test", db).gte({x : 0})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x >= 0");
        }
    }
}).run(); // Run it

vows.describe('mysql lt operation').addBatch({
    'when finding a number < one': {
        topic: function () { return new Mysql("test", db).lt({x : 1})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x < 1");
        }
    }
}).run(); // Run it

vows.describe('mysql lte operation').addBatch({
    'when finding a number <= to one': {
        topic: function () { return new Mysql("test", db).lte({x : 1})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1");
        }
    }
}).run(); // Run it

vows.describe('chain mysql operations').addBatch({
    'when finding a number <= to one and y >= 1': {
        topic: function () { return new Mysql("test", db).lte({x : 1}).gte({y : 1})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one and y >= 1 using and': {
        topic: function () { return new Mysql("test", db).lte({x : 1}).and({y : { gte : 1}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one and y >= 1 using and chain': {
        topic: function () { return new Mysql("test", db).lte({x : 1}).and().gte({y : 1})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding a number <= to one or y >= 1 or': {
        topic: function () { return new Mysql("test", db).lte({x : 1}).or({y : {gte : 1}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1 or y >= 1");
        }
    },

    'when finding a number <= to one or y >= 1 using or chain': {
        topic: function () { return new Mysql("test", db).lte({x : 1}).or().gte({y : 1})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1 or y >= 1");
        }
    },
}).run(); // Run it


vows.describe('mysql find operation').addBatch({
    'when finding a number > zero': {
        topic: function () { return new Mysql("test", db).find({x : {gt : 0}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x > 0");
        }
    },
    'when finding a number >= to 0': {
        topic: function () { return new Mysql("test", db).find({x : {gte : 0}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x >= 0");
        }
    },

    'when finding a number < 1': {
        topic: function () { return new Mysql("test", db).find({x : {lt : 1}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x < 1");
        }
    },

    'when finding a number <= to 1': {
        topic: function () { return new Mysql("test", db).find({x : {lte : 1}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1");
        }
    },

    'when finding x <= to 1 and  y >= to 1': {
        topic: function () { return new Mysql("test", db).find({x : {lte : 1}, y : {gte : 1}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x <= 1 and y >= 1");
        }
    },

    'when finding x > 0 and  y >= 1 z < 1 k <= 1': {
        topic: function () { return new Mysql("test", db).find({x : {gt : 0}, y : {gte : 1}, z : {lt : 1}, k : {lte : 1}})},

        'we get ': function (topic) {
            assert.equal (topic.sql, "select * from test where x > 0 and y >= 1 and z < 1 and k <= 1");
        }
    }
}).run(); // Run it