var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.loadModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/oneToOne",
        start : 0,
        up : true
    };
    moose.migrate(options)
            .chain(hitch(moose, "loadSchemas", ["works", "employee"]))
            .then(function(works, employee) {
        var Works = moose.addModel(works);
        var Employee = moose.addModel(employee);
        //define associations
        Employee.oneToOne("works", {model : Works.tableName, key : {eid : "eid"}});
        Employee.oneToOne("customWorks", {
            model : Works.tableName,
            filter : function(){
                return Works.filter({eid : this.eid});
            }
        });
        Works.manyToOne("employee", {model : Employee.tableName, key : {eid : "eid"}});
        ret.callback();
    }, hitch(console, "log"));

    return ret;
};

exports.dropModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/oneToOne",
        start : 0,
        up : false
    };
    moose.migrate(options).then(moose.hitch(ret, "callback"), moose.hitch(ret, "errback"));
    return ret;
};