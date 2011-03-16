var moose = require("../../lib"),
    airlines = require("../tables");

module.exports = exports = (Flight =  moose.addModel(airlines.flight, {
    plugins : [moose.plugins.CachePlugin],
    instance :{
        toObject : function(){
            var obj = this.super(arguments);
            obj.legs = this.legs.map(function(l){return l.toObject()});
            return obj;
        }
    }
}));

var fetchType = Flight.fetchType;
Flight.oneToMany("legs", {
    model : airlines.flightLeg.tableName,
    orderBy : "scheduledDepartureTime",
    key : {id : "flightId"},
    fetchType :fetchType.EAGER

});

