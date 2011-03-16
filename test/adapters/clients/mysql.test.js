var vows = require('vows'),
        assert = require('assert'),
        moose = require("../../../lib"),
        sql = require("../../tables/dataset").sql;
// Create a Test Suite
moose.createConnection({user : "test", password : "testpass", database : 'test'});
var client = moose.getConnection();

client.query("drop employee").then(function(res){
    console.log(res);
});

