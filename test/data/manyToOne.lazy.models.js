var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        comb = require("comb");

exports.loadModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToOne",
        start : 0,
        up : true
    };
    moose.migrate(options)
            .chain(comb.hitch(moose, "loadSchemas", ["company", "employee"]), comb.hitch(ret, "errback"))
            .then(function(company, employee) {
        var Company = moose.addModel(company);
        var Employee = moose.addModel(employee);
        //define associations

        Employee.manyToOne("company", {model : Company.tableName, fetchType : Employee.fetchType.EAGER, key : {companyId : "id"}});
        Company.oneToMany("employees", {model : Employee.tableName, orderBy : {id : "desc"}, key : {id : "companyId"}});
        ret.callback();
    }, comb.hitch(console, "log"));

    return ret;
};

exports.dropModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToOne",
        start : 0,
        up : false
    };
    moose.migrate(options).chain(comb.hitch(moose, "closeConnection"), comb.hitch(ret, "errback")).then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));
    return ret;
};

