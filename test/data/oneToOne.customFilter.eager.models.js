var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        comb = require("comb");

exports.loadModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/oneToOne",
        start : 0,
        up : true
    };
    moose.migrate(options)
            .chain(comb.hitch(moose, "loadSchemas", ["works", "employee"]), comb.hitch(ret, "errback"))
            .then(function(works, employee) {
        var Works = moose.addModel(works);
        var Employee = moose.addModel(employee);
        //define associations
        Employee.oneToOne("works", {model : Works.tableName, fetchType : Employee.fetchType.EAGER, key : {eid : "eid"}});
        Employee.oneToOne("customWorks", {
            model : Works.tableName,
            fetchType : Employee.fetchType.EAGER,
            filter : function(){
                return Works.filter({eid : this.eid});
            }
        });
        Works.manyToOne("employee", {model : Employee.tableName, key : {eid : "eid"}});
        ret.callback();
    }, comb.hitch(console, "log"));

    return ret;
};

exports.dropModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/oneToOne",
        start : 0,
        up : false
    };
    moose.migrate(options).chain(comb.hitch(moose, "closeConnection"), comb.hitch(ret, "errback")).then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));
    return ret;
};