var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.loadModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/model",
        start : 0,
        up : false
    };
    moose.migrate(options).then(function() {
        moose.migrate(moose.merge(options, {up : true}))
                .chain(hitch(moose, "loadSchema", "employee"))
                .then(function(employee) {
            var Employee = moose.addModel(employee, {
                plugins : [moose.plugins.TimeStampPlugin]
            });
            ret.callback();
        }, hitch(console, "log"));
    });
    return ret;
}