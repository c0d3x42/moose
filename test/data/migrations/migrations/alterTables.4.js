var moose = require("../../../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.up = function() {
    moose.alterTable("company", function(table) {
        table.rename("companyNew");
        table.addUnique("companyName");
        table.addColumn("employeeCount", types.INT());
        table.addUnique(["companyName", "employeeCount"]);
    });
};

exports.down = function() {
    moose.alterTable("companyNew", function(table) {
        table.rename("company");
        table.dropUnique("companyName");
        table.dropUnique(["companyName", "employeeCount"]);
        table.dropColumn("employeeCount");
    });
};