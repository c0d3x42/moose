var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.loadDefaultModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/plugins/timestamp",
        start : 0,
        end : 0,
        up : true
    };
    moose.migrate(options)
            .chain(hitch(moose, "loadSchema", "employee"))
            .then(function(employee) {
        var Employee = moose.addModel(employee, {
            plugins : [moose.plugins.TimeStampPlugin]
        });
        Employee.timestamp();
        ret.callback();
    }, hitch(console, "log"));
    return ret;
};

exports.dropDefaultModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/plugins/timestamp",
        start : 0,
        end : 0,
        up : false
    };
    moose.migrate(options).then(moose.hitch(ret, "callback"), moose.hitch(ret, "errback"));
    return ret;
};

exports.loadCustomModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/plugins/timestamp",
        start : 0,
        up : true
    };

    moose.migrate(options)
            .chain(hitch(moose, "loadSchema", "employee"))
            .then(function(employee) {
        var Employee = moose.addModel(employee, {
            plugins : [moose.plugins.TimeStampPlugin]
        });
        Employee.timestamp({updated : "updatedAt", created : "createdAt"});
        ret.callback();
    }, moose.hitch(ret, "errback"));

    return ret;
};

exports.dropCustomModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/plugins/timestamp",
        start : 0,
        up : false
    };
    moose.migrate(options).then(moose.hitch(ret, "callback"), moose.hitch(ret, "errback"));
    return ret;
};

exports.loadUpdateOnCreateModels = function() {
    var ret = new moose.Promise();
  var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/plugins/timestamp",
        start : 0,
        end : 0,
        up : true
    };

    moose.migrate(options)
            .chain(hitch(moose, "loadSchema", "employee"))
            .then(function(employee) {
        var Employee = moose.addModel(employee, {
            plugins : [moose.plugins.TimeStampPlugin]
        });
        Employee.timestamp({updateOnCreate : true});
        ret.callback();
    }, moose.hitch(ret, "errback"));

    return ret;
};

exports.dropUpdateOnCreateModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/plugins/timestamp",
        start : 0,
        end : 0,
        up : false
    };
    moose.migrate(options).then(moose.hitch(ret, "callback"), moose.hitch(ret, "errback"));
    return ret;
};