var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

var schema = new moose.Table("employee", {
    eid :             types.INT({allowNull : false, autoIncrement : true}),
    firstname :       types.VARCHAR({length : 20, allowNull : false}),
    lastname :        types.VARCHAR({length : 20, allowNull : false}),
    midinitial :      types.CHAR({length : 1}),
    gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
    street :          types.VARCHAR({length : 50, allowNull : false}),
    city :            types.VARCHAR({length : 20, allowNull : false})
});
schema.primaryKey("eid");

exports.employee = schema;