var moose = require("../../lib"),
        airlines = require("../tables");

module.exports = exports = (LegInstance = moose.addModel(airlines.legInstance));

var fetchType = LegInstance.fetchType;
LegInstance.manyToOne("airplane", {
    model : airlines.airplane.tableName,
    fetchType : fetchType.EAGER,
    key : {id : "type_id"}
});

LegInstance.manyToOne("flightLeg", {
    model : airlines.flightLeg.tableName,
    fetchType : fetchType.EAGER,
    key : {flightLegId : "id"}
});
