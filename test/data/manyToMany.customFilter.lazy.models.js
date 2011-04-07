var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.loadModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToMany",
        start : 0,
        up : true
    };

    moose.migrate(options)
            .chain(hitch(moose, "loadSchemas", ["company", "employee", "companyEmployee"]), hitch(ret, "errback"))
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
        Company.manyToMany("omahaEmployees", {
            model : "employee",
            filter : function(){
                var companyEmloyeeDataset = CompanyEmployee.getDataset().select('employeeId').find({companyId : this.id});
                return Employee.filter({id : {"in" : companyEmloyeeDataset}, city : 'Omaha'}).order("lastname");
            },
            joinTable : "companyEmployee",
            key : {companyId : "employeeId"}
        });
        ret.callback();
    }, hitch(ret, "errback"));
    return ret;
};

exports.dropModels = function() {
    var ret = new moose.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'test'},
        dir : "./data/migrations/manyToMany",
        start : 0,
        up : false
    };
    moose.migrate(options).then(moose.hitch(ret, "callback"), moose.hitch(ret, "errback"));
    return ret;
};