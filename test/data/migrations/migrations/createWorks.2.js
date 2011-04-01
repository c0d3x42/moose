var moose = require("../../../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.up = function() {
    moose.createTable("works", function(table) {
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("eid", types.INT({allowNull : false}));
        table.column("companyName", types.VARCHAR({length : 20, allowNull : false}));
        table.column("salary", types.DOUBLE({size : 8, digits : 2, allowNull : false}));
        table.primaryKey("id");
        table.foreignKey("eid", {employee : "id"});

    });
};

exports.down = function() {
    moose.dropTable("works");
};