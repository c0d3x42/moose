var moose = require("../../lib");

module.exports = exports = (LegInstance = moose.addModel(moose.getSchema("leg_instance")));

var fetchType = LegInstance.fetchType;
LegInstance.manyToOne("airplane", {
    model : "airplane",
    fetchType : fetchType.EAGER,
    key : {id : "type_id"}
});

LegInstance.manyToOne("flightLeg", {
    model : "flight_leg",
    fetchType : fetchType.EAGER,
    key : {flightLegId : "id"}
});
