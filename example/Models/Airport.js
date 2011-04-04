var moose = require("../../lib"),
    expressPlugin = require("../plugins/ExpressPlugin");

module.exports = exports = (Airport = moose.addModel(moose.getSchema("airport"), {
    plugins : [moose.plugins.CachePlugin, expressPlugin]
}));

var fetchType = Airport.fetchType;
Airport.manyToMany("supportedAirplaneTypes", {
    joinTable : "can_land",
    model : "airplane_type",
    key : {airportCode : "typeId"}
});
