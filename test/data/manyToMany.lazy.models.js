var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        comb = require("comb");

exports.loadModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToMany",
        start : 0,
        up : true
    };

    moose.migrate(options)
            .chain(comb.hitch(moose, "loadSchemas", ["company", "employee", "companyEmployee"]), comb.hitch(ret, "errback"))
            .then(function(company, employee, companyEmployee) {
        var Company = moose.addModel(company);
        var Employee = moose.addModel(employee);
        var CompanyEmployee = moose.addModel(companyEmployee);
        //define associations

        Employee.manyToMany("companies", {
            model : "company",
            joinTable : "companyEmployee",
            key : {employeeId : "companyId"}
        });
        Company.manyToMany("employees", {
            model : "employee",
            orderBy : {id : "desc"},

            joinTable : "companyEmployee",
            key : {companyId : "employeeId"}
        });
        ret.callback();
    }, comb.hitch(ret, "errback"));
    return ret;
};

exports.dropModels = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToMany",
        start : 0,
        up : false
    };
    moose.migrate(options).chain(comb.hitch(moose, "closeConnection"), comb.hitch(ret, "errback")).then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));
    return ret;
};