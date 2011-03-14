var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

var works = new moose.Table("works", {
    id :           types.INT({allowNull : false,primaryKey : true, autoIncrement : true}),
    eid :          types.INT({allowNull : false, foreignKey : {employee : "eid"}}),
    companyName :  types.VARCHAR({length : 20, allowNull : false}),
    salary :       types.DOUBLE({size : 8, digits : 2, allowNull : false})
});

var employee = new moose.Table("employee", {
    eid :             types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    firstname :       types.VARCHAR({length : 20, allowNull : false}),
    lastname :        types.VARCHAR({length : 20, allowNull : false}),
    midinitial :      types.CHAR({length : 1}),
    gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
    street :          types.VARCHAR({length : 50, allowNull : false}),
    city :            types.VARCHAR({length : 20, allowNull : false})
});

exports.works = works;
exports.employee = employee;