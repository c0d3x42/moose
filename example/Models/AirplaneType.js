var moose = require("../../lib");

module.exports = exports =(AirPlaneType = moose.addModel(moose.getSchema("airplane_type")));

var fetchType = AirPlaneType.fetchType;
AirPlaneType.manyToMany("supportedAirports", {
    joinTable : "can_land",
    fetchType : fetchType.EAGER,
    model : "airport",
    key : {airportCode : "typeId"}
});

AirPlaneType.oneToMany("airplanes", {model : "airplane", key : {type_id : "id"}});
