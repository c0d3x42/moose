var moose = require("../../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        Table = moose.Table;


exports.up = function() {
    moose.createTable("airport", function(table){
        table.engine("InnoDB");
        table.column("airportCode", types.VARCHAR({length : 4, allowNull : false}));
        table.column("name", types.VARCHAR({allowNull : false}));
        table.column("city", types.STRING({allowNull : false}));
        table.column("state", types.VARCHAR({length : 2, allowNull : false}));
        table.primaryKey("airportCode");
    });

    moose.createTable("airplane_type", function(table){
        table.engine("InnoDB");
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("name", types.VARCHAR({allowNull : false}));
        table.column("maxSeats", types.INT({size : 3, allowNull: false}));
        table.column("company", types.STRING({allowNull : false}));
        table.primaryKey("id");
    });

    moose.createTable("flight", function(table){
        table.engine("InnoDB");
        table.column("id", types.INT({allowNull : false, primaryKey : true, autoIncrement : true}));
        table.column("weekdays", types.SET({enums : ["M", 'T',"W","TH","F","S","SU"], allowNull : false}));
        table.column("airline", types.STRING({allowNull : false}));
        table.primaryKey("id");
    });

    moose.createTable("can_land", function(table){
        table.engine("InnoDB");
        table.column("typeId", types.INT({allowNull : false}));
        table.column("airportCode",types.STRING({length : 4, allowNull : false}));
        table.primaryKey(["airportCode", "typeId"]);
        table.foreignKey({typeId : {airplane_type : "id"}, airportCode : {airport : "airportCode"}});
    });


    moose.createTable("airplane", function(table){
        table.engine("InnoDB");
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("type_id", types.INT({allowNull : false}));
        table.column("totalNoOfSeats", types.NUMBER({size : 3, allowNull: false}));
        table.primaryKey("id");
        table.foreignKey("type_id", {airplane_type : "id"});
    });

    moose.createTable("flight_leg", function(table){
        table.engine("InnoDB");
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("flightId", types.INT({allowNull : false}));
        table.column("departureCode", types.STRING({length : 4, allowNull : false}));
        table.column("scheduledDepartureTime", types.TIME());
        table.column("arrivalCode", types.STRING({length : 4, allowNull : false}));
        table.column("scheduledArrivalTime", types.TIME());
        table.primaryKey("id");
        table.foreignKey({departureCode : {airport : "airportCode"}});
        table.foreignKey({arrivalCode : {airport : "airportCode"}});
        table.foreignKey({flightId : {flight : "id"}});
    });

    moose.createTable("leg_instance", function(table){
        table.engine("InnoDB");
        table.column("airplaneId", types.INT({allowNull : false}));
        table.column("id", types.INT({allowNull : false, autoIncrement : true}));
        table.column("flightLegId", types.INT({allowNull : false}));
        table.column("date", types.DATE());
        table.column("arr_time", types.DATETIME());
        table.column("dep_time", types.DATETIME());
        table.primaryKey("id");
        table.foreignKey("flightLegId", {flight_leg : "id"});
    });

};

exports.down = function(){
    moose.dropTable("leg_instance");
    moose.dropTable("flight_leg");
    moose.dropTable("flight");
    moose.dropTable("airplane");
    moose.dropTable("can_land");
    moose.dropTable("airplane_type");
    moose.dropTable("airport");
};

