var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        comb = require("comb");

exports.loadModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/model",
        start : 0,
        up : true
    };
    moose.migrate(options)
            .chain(comb.hitch(moose, "loadSchema", "employee"), comb.hitch(ret, "errback"))
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
    }, comb.hitch(console, "log"));

    return ret;
};

exports.dropModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/model",
        start : 0,
        up : false
    };
    moose.migrate(options).chain(comb.hitch(moose, "closeConnection"), comb.hitch(ret, "errback")).then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));
    return ret;
};