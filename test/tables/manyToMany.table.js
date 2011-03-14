var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

var company = new moose.Table("company", {
    id :           types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    companyName :   types.VARCHAR({length : 20, allowNull : false})
});

var employee = new moose.Table("employee", {
    id :             types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    firstname :       types.VARCHAR({length : 20, allowNull : false}),
    lastname :        types.VARCHAR({length : 20, allowNull : false}),
    midinitial :      types.CHAR({length : 1}),
    gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
    street :          types.VARCHAR({length : 50, allowNull : false}),
    city :            types.VARCHAR({length : 20, allowNull : false})
});

var companyEmployee = new moose.Table("companyEmployee", {
    companyId :  types.INT({allowNull : false, foreignKey : {company : "id"}}),
    employeeId :  types.INT({allowNull : false, foreignKey : {employee : "id"}})
});


exports.company = company;
exports.employee = employee;
exports.companyEmployee = companyEmployee;