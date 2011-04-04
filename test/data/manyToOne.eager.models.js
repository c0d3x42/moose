var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.loadModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToOne",
        start : 0,
        up : true
    };

    moose.migrate(options)
            .chain(hitch(moose, "loadSchemas", ["company", "employee"]))
            .then(function(company, employee) {
        var Company = moose.addModel(company);
        var Employee = moose.addModel(employee);
        //define associations

        Employee.manyToOne("company", {model : Company.tableName, key : {companyId : "id"}});
        Company.oneToMany("employees", {model : Employee.tableName, orderBy : {id : "desc"}, fetchType : Company.fetchType.EAGER, key : {id : "companyId"}});
        ret.callback();
    }, hitch(console, "log"));

    return ret;
};

exports.dropModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToOne",
        start : 0,
        up : false
    };
    moose.migrate(options).then(moose.hitch(ret, "callback"), moose.hitch(ret, "errback"));
    return ret;
};