var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

var works = new moose.Table("works", {
    id :           types.INT({allowNull : false, autoIncrement : true}),
    eid :          types.INT({allowNull : false}),
    companyName :  types.VARCHAR({length : 20, allowNull : false}),
    salary :       types.DOUBLE({size : 8, digits : 2, allowNull : false})
});
works.primaryKey("id");
works.foreignKey("eid", {employee : "eid"});

var employee = new moose.Table("employee", {
    eid :             types.INT({allowNull : false, autoIncrement : true}),
    firstname :       types.VARCHAR({length : 20, allowNull : false}),
    lastname :        types.VARCHAR({length : 20, allowNull : false}),
    midinitial :      types.CHAR({length : 1}),
    gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
    street :          types.VARCHAR({length : 50, allowNull : false}),
    city :            types.VARCHAR({length : 20, allowNull : false})
});
employee.primaryKey("eid");

exports.works = works;
exports.employee = employee;