var moose = require("../../lib");

module.exports = exports = (FlightLeg = moose.addModel(moose.getSchema("flight_leg"), {
    plugins : [moose.plugins.CachePlugin],
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
    model : "leg_instance",
    key : {id : "flightLegId"}
});

FlightLeg.manyToOne("departs", {
    model : "airport",
    fetchType : fetchType.EAGER,
    key : {departureCode : "airportCode"}
});

FlightLeg.manyToOne("arrives", {
    model : "airport",
    fetchType : fetchType.EAGER,
    key : {arrivalCode : "airportCode"}
});
