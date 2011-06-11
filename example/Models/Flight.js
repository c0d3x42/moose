var moose = require("../../lib"),
        expressPlugin = require("../plugins/ExpressPlugin");

module.exports = exports = (Flight = moose.addModel(moose.getSchema("flight"), {
    plugins : [ expressPlugin],
    instance :{
        toObject : function() {
            var obj = this.super(arguments);
            obj.legs = this.legs.map(function(l) {
                return l.toObject();
            });
            return obj;
        }
    }
}));

var fetchType = Flight.fetchType;
Flight.oneToMany("legs", {
    model : "flight_leg",
    orderBy : "scheduledDepartureTime",
    key : {id : "flightId"},
    fetchType :fetchType.EAGER

});

