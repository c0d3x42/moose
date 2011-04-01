var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.loadModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToMany",
        start : 0,
        up : false
    };

    moose.migrate(options).then(function() {
        moose.migrate(moose.merge(options, {up : true}))
                .chain(hitch(moose, "loadSchemas", ["company", "employee", "companyEmployee"]))
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
                fetchType : Company.fetchType.EAGER,
                joinTable : "companyEmployee",
                key : {companyId : "employeeId"}
            });
            ret.callback();
        }, hitch(console, "log"));
    });
    return ret;
};