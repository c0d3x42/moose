var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        Table = moose.Table;

exports.airport = new Table("airport", {
    airportCode : types.VARCHAR({length : 4, allowNull : false, primaryKey : true}),
    name : types.VARCHAR({allowNull : false}),
    city : types.STRING({allowNull : false}),
    state :types.VARCHAR({length : 2, allowNull : false})
});

exports.canLand = new Table("can_land", {
    typeId : types.INT({allowNull : false}),
    airportCode : types.STRING({length : 4, allowNull : false,primaryKey : true})
});

exports.airplaneType = new Table("airplane_type", {
    id        : types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    name :      types.VARCHAR({allowNull : false}),
    maxSeats :  types.INT({size : 3, allowNull: false}),
    company   : types.STRING({allowNull : false})
});

exports.airplane = new Table("airplane", {
    id : types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    type_id : types.INT({allowNull : false}),
    totalNoOfSeats : types.NUMBER({size : 3, allowNull: false})
});

exports.flightLeg = new Table("flight_leg", {
    id : types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    flightId :  types.INT({allowNull : false}),
    departureCode : types.STRING({length : 4, allowNull : false}),
    scheduledDepartureTime : types.TIME(),
    arrivalCode : types.STRING({length : 4, allowNull : false}),
    scheduledArrivalTime : types.TIME()
});

exports.legInstance = new Table("leg_instance", {
    airplaneId : types.INT({allowNull : false}),
    id : types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    flightLegId : types.INT({allowNull : false}),
    date : types.DATE(),
    arr_time : types.DATETIME(),
    dep_time : types.DATETIME()
});

exports.flight = new Table("flight", {
    id : types.INT({allowNull : false, primaryKey : true, autoIncrement : true}),
    weekdays : types.SET({enums : ["M", 'T',"W","TH","F","S","SU"], allowNull : false}),
    airline : types.STRING({allowNull : false})
});

