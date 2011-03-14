var moose = require("../../lib"),
    airlines = require("../tables");

module.exports = exports =(AirPlaneType = moose.addModel(airlines.airplaneType));

var fetchType = AirPlaneType.fetchType;
AirPlaneType.manyToMany("supportedAirports", {
    joinTable : airlines.canLand.tableName,
    fetchType : fetchType.EAGER,
    model : airlines.airport.tableName,
    key : {airportCode : "typeId"}
});

AirPlaneType.oneToMany("airplanes", {model : airlines.airplane.tableName,key : {type_id : "id"}});
