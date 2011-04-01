var moose = require("../../../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.up = function() {
    moose.createTable("company", function(table) {
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("companyName", types.VARCHAR({length : 20, allowNull : false}));
        table.primaryKey("id");
    });
};

exports.down = function() {
    moose.dropTable("company");
};