var moose = require("../../../../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types;

exports.up = function() {
    moose.alterTable("employee", function(table) {
        table.renameColumn("updated", "updatedAt");
        table.renameColumn("created", "createdAt");
    });
};

exports.down = function() {
    moose.alterTable("employee", function(table) {
        table.renameColumn("updatedAt", "updated");
        table.renameColumn("createdAt", "created");
    });
};