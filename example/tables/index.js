var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        Table = moose.Table;

exports.airport = new Table("airport", {
    airportCode : types.VARCHAR({length : 4, allowNull : false}),
    name : types.VARCHAR({allowNull : false}),
    city : types.STRING({allowNull : false}),
    state :types.VARCHAR({length : 2, allowNull : false}),
    primaryKey : "airportCode"
});

exports.canLand = new Table("can_land", {
    typeId : types.INT({allowNull : false}),
    airportCode : types.STRING({length : 4, allowNull : false}),
    primaryKey : "airportCode"
});
exports.canLand.foreignKey({typeId : {airplaneType : "id"}, airportCode : {airport : "airportCode"}});

exports.airplaneType = new Table("airplane_type", {
    id        : types.INT({allowNull : false, autoIncrement : true}),
    name :      types.VARCHAR({allowNull : false}),
    maxSeats :  types.INT({size : 3, allowNull: false}),
    company   : types.STRING({allowNull : false}),
    primaryKey : "id"
});

exports.airplane = new Table("airplane", {
    id : types.INT({allowNull : false, autoIncrement : true}),
    type_id : types.INT({allowNull : false}),
    totalNoOfSeats : types.NUMBER({size : 3, allowNull: false}),
    primaryKey : "id"
});
exports.airplane.foreignKey("type_id", {airplaneType : "id"});



exports.flightLeg = new Table("flight_leg", {
    id : types.INT({allowNull : false, autoIncrement : true}),
    flightId :  types.INT({allowNull : false}),
    departureCode : types.STRING({length : 4, allowNull : false}),
    scheduledDepartureTime : types.TIME(),
    arrivalCode : types.STRING({length : 4, allowNull : false}),
    scheduledArrivalTime : types.TIME(),
    primaryKey : "id"
});

exports.flightLeg.foreignKey(["departureCode", "arrivalCode"], {airport : ["airportCode", "airportCode"]});
exports.flightLeg.foreignKey({flightId : {flight : "id"}});

exports.legInstance = new Table("leg_instance", {
    airplaneId : types.INT({allowNull : false}),
    id : types.INT({allowNull : false, autoIncrement : true}),
    flightLegId : types.INT({allowNull : false}),
    date : types.DATE(),
    arr_time : types.DATETIME(),
    dep_time : types.DATETIME(),
    primaryKey : "id"
});
exports.legInstance.foreignKey("flightLegId", {flightLeg : "id"});


exports.flight = new Table("flight", {
    id : types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    weekdays : types.SET({enums : ["M", 'T',"W","TH","F","S","SU"], allowNull : false}),
    airline : types.STRING({allowNull : false}),
    primaryKey : "id"
});

