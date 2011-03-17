var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

var company = new moose.Table("company", {
    id :           types.INT({allowNull : false, autoIncrement : true}),
    companyName :   types.VARCHAR({length : 20, allowNull : false})
});
company.primaryKey("id");

var employee = new moose.Table("employee", {
    eid :             types.INT({allowNull : false, autoIncrement : true}),
    firstname :       types.VARCHAR({length : 20, allowNull : false}),
    lastname :        types.VARCHAR({length : 20, allowNull : false}),
    midinitial :      types.CHAR({length : 1}),
    gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
    street :          types.VARCHAR({length : 50, allowNull : false}),
    city :            types.VARCHAR({length : 20, allowNull : false}),
    companyId :       types.INT({allowNull : false})
});
employee.primaryKey("eid");
employee.foreignKey("companyId", {company : "id"});

exports.company = company;
exports.employee = employee;