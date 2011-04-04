var moose = require("../lib"),
        helpers = require("./helpers"),
        express = require("express");

helpers.loadData().then(function() {
    var app = express.createServer();
    Flight.route(app);
    Airport.route(app);
    app.listen(3000);
}, function(err){
    err.forEach(function(err){
        console.log(err[1]);
    });
    throw err;
});