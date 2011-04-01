var moose = require("../../../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.up = function() {

    moose.createTable("companyEmployee", function(table) {
        table.column("companyId", types.INT({allowNull : false}));
        table.column("employeeId", types.INT({allowNull : false}));
        table.primaryKey(["companyId", "employeeId"]);
        table.foreignKey({companyId : {company : "id"}, employeeId : {employee : "id"}});
    });
};

exports.down = function() {
    moose.dropTable("companyEmployee");
};