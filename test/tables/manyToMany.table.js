var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

var company = new moose.Table("company", {
    id :           types.INT({allowNull : false, autoIncrement : true}),
    companyName :   types.VARCHAR({length : 20, allowNull : false})
});
company.primaryKey("id");

var employee = new moose.Table("employee", {
    id :             types.INT({allowNull : false, autoIncrement : true}),
    firstname :       types.VARCHAR({length : 20, allowNull : false}),
    lastname :        types.VARCHAR({length : 20, allowNull : false}),
    midinitial :      types.CHAR({length : 1}),
    gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
    street :          types.VARCHAR({length : 50, allowNull : false}),
    city :            types.VARCHAR({length : 20, allowNull : false})
});
employee.primaryKey("id");

var companyEmployee = new moose.Table("companyEmployee", {
    companyId :  types.INT({allowNull : false}),
    employeeId :  types.INT({allowNull : false})
});

companyEmployee.primaryKey(["companyId", "employeeId"]);
companyEmployee.foreignKey({companyId : {company : "id"}, employeeId : {employee : "id"}});

exports.company = company;
exports.employee = employee;
exports.companyEmployee = companyEmployee;