var moose = require("../../lib"),
        airlines = require("../tables");

module.exports = exports = (Airplane = moose.addModel(airlines.airplane));

var fetchType = Airplane.fetchType;
Airplane.manyToOne("type", {model : airlines.airplaneType.tableName,fetchType : fetchType.EAGER,key : {type_id : "id"}});
Airplane.oneToMany("legs", {model : airlines.legInstance.tableName,key : {type_id : "id"}});

