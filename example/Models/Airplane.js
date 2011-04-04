var moose = require("../../lib");

//assume airplane has been loaded
module.exports = exports = (Airplane = moose.addModel(moose.getSchema("airplane")));

var fetchType = Airplane.fetchType;
Airplane.manyToOne("type", {model : "airplane_type",fetchType : fetchType.EAGER,key : {type_id : "id"}});
Airplane.oneToMany("legs", {model : "leg_instance",key : {type_id : "id"}});

