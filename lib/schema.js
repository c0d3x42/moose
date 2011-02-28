adapters = require("./adapters"),
        util = require("./util");

exports.schema = (Schema = function(tableName, properties){
    if(!tableName) throw new Error("table name required");
    this.tableName = tableName;
    this.type = properties.type || "mysql";
    delete properties.type;
    var defaults = adapters[this.type].columnDefaults;
    for(var i in properties){

    }
});

schema.prototype.getType = function(columnName){

}