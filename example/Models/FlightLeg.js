var moose = require("../../lib"),
    airlines = require("../tables");

module.exports = exports = (FlightLeg = moose.addModel(airlines.flightLeg, {
    instance : {
        toObject : function(){
            var obj = this.super(arguments);
            delete obj.departureCode;
            delete obj.arrivalCode;
            obj.departs = this.departs.toObject();
            obj.arrives = this.arrives.toObject();
            return obj;
        }
    }
}));

var fetchType = FlightLeg.fetchType;
FlightLeg.oneToMany("legInstances", {
    model : airlines.legInstance.tableName,
    key : {id : "flightLegId"}
});

FlightLeg.manyToOne("departs", {
    model : airlines.airport.tableName,
    fetchType : fetchType.EAGER,
    key : {departureCode : "airportCode"}
});

FlightLeg.manyToOne("arrives", {
    model : airlines.airport.tableName,
    fetchType : fetchType.EAGER,
    key : {arrivalCode : "airportCode"}
});
