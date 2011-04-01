var moose = require("../../../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.up = function() {
    moose.createTable("company", function(table) {
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("companyName", types.VARCHAR({length : 20, allowNull : false}));
        table.primaryKey("id");
    });
    moose.createTable("employee", function(table) {
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("firstname", types.VARCHAR({length : 20, allowNull : false}));
        table.column("lastname", types.VARCHAR({length : 20, allowNull : false}));
        table.column("midinitial", types.CHAR({length : 1}));
        table.column("gender", types.ENUM({enums : ["M", "F"], allowNull : false}));
        table.column("street", types.VARCHAR({length : 50, allowNull : false}));
        table.column("city", types.VARCHAR({length : 20, allowNull : false}));
        table.column("companyId", types.INT({allowNull : false}));
        table.primaryKey("id");
        table.foreignKey("companyId", {company : "id"});
    });

};

exports.down = function() {
    moose.dropTable("companyEmployee");
    moose.dropTable("works");
    moose.dropTable("employee");
    moose.dropTable("company");
};