var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.loadModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/model",
        start : 0,
        up : true
    };
    moose.migrate(options)
            .chain(hitch(moose, "loadSchema", "employee"))
            .then(function(employee) {
        var Employee = moose.addModel(employee, {
            static : {
                //class methods
                findByGender : function(gender, callback, errback) {
                    this.filter({gender : gender}).all(callback, errback);
                }
            },
            instance : {} //instance methods
        });
        ret.callback();
    }, hitch(console, "log"));

    return ret;
};

exports.dropModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/model",
        start : 0,
        up : false
    };
    moose.migrate(options).then(moose.hitch(ret, "callback"), moose.hitch(ret, "errback"));
    return ret;
};