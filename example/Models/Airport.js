var moose = require("../../lib"),
        airlines = require("../tables");

module.exports = exports = (Airport = moose.addModel(airlines.airport, {
    plugins : [moose.plugins.CachePlugin]
}));

var fetchType = Airport.fetchType;
Airport.manyToMany("supportedAirplaneTypes", {joinTable : airlines.canLand.tableName,model : airlines.airplaneType.tableName, key : {airportCode : "typeId"}});
