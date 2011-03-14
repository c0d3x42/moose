var moose = require("../lib"),
        models = require("./models"),
        helpers = require("./helpers"),
        express = require("express"),
        expressPlugin = require("./plugins/ExpressPlugin");

models.Airport.mixin(expressPlugin);
models.Flight.mixin(expressPlugin);

helpers.loadData().then(function() {
    var app = express.createServer();
    Flight.route(app);
    Airport.route(app);
    app.listen(3000);

});