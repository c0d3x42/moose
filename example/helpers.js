var moose = require("../lib"),
        models = require("./models"),
        comb = require("comb");

/***************************START MOCK DATA*********************/
var airports = [
    {airportCode : "OMA",name : "Eppley Airfield",city : "Omaha",state :"NE"},
    {airportCode : "ABR",name : "Aberdeen",city : "Aberdeen",state :"SD"},
    {airportCode : "ASE",name : "Aspen Pitkin County Airport",city : "Aspen",state :"CO"},
    {airportCode : "ATL",name : "Atlanta International Airport",city : "Atlanta",state :"GA"},
    {airportCode : "ORD",name : "O'Hare International Airport",city : "Chicago",state :"IL"},
    {airportCode : "LAX",name : "Los Angeles International Airport",city : "Los Angeles",state :"CA"},
    {airportCode : "DFW",name : "Dallas/Ft. Worth International Airport",city : "Dallas",state :"TX"},
    {airportCode : "DEN",name : "Denver International Airport",city : "Denver",state :"CO"},
    {airportCode : "LAS",name : "McCarran International Airport",city : "Las Vegas",state :"NV"},
    {airportCode : "JFK",name : "John F. Kennedy International Airport",city : "New York",state :"NY"},
    {airportCode : "PHX",name : "Phoenix Sky Harbor International Airport",city : "Phoenix",state :"AZ"},
    {airportCode : "IAH",name : "George Bush Intercontinental Airport",city : "Houston",state :"TX"},
    {airportCode : "EWR",name : "Newark Liberty International Airport",city : "Newark",state :"NJ"}

];

var airplaneTypes = [
    {name :"Airbus A319-100",           maxSeats :  124,company   : "Airbus"},
    {name :"Boeing 737-800",            maxSeats :  160,company   : "Boeing"},
    {name :"Boeing 747-400",            maxSeats :  403,company   : "Boeing"},
    {name :"Canadair Regional Jet 200", maxSeats :  50, company   : "Canadair"},
    {name :"Embraer 175 ",              maxSeats :  76,company   : "Compass Airlines"},
    {name :"Agusta A109 MkII",          maxSeats :  6,company   : "Agusta"},
    {name :"Cessna 414",                maxSeats :  6,company   : "Cessna"}
];

var dateUtil = function(date, amount, type) {
    var timeConv = {"seconds" : 1000, "minutes" : 60000, "hours" : 3600000};
    amount = timeConv[type] * amount;
    return new Date(date.getTime() + amount);
};

var flights = [
    {
        weekdays : ["M", 'T',"W","TH","F","S","SU"],
        airline : "Delta",
        legs : [
            {departureCode : "LAX", scheduledDepartureTime : new Date(), arrivalCode : "DEN", scheduledArrivalTime : dateUtil(new Date(), 2, "hours")},
            {departureCode : "DEN", scheduledDepartureTime : dateUtil(new Date(), 150, "minutes"), arrivalCode : "ATL",  scheduledArrivalTime : dateUtil(new Date(), 5, "hours")},
            {departureCode : "ATL", scheduledDepartureTime : dateUtil(dateUtil(new Date(), 5, "hours"), 30, "minutes"), arrivalCode : "EWR",  scheduledArrivalTime : dateUtil(dateUtil(dateUtil(new Date(), 5, "hours"), 30, "minutes"), 1, "hours")}
        ]
    },
    {
        weekdays : ["M", 'T',"W","TH","F"],
        airline : "Delta",
        legs : [
            {departureCode : "LAX", scheduledDepartureTime : new Date(), arrivalCode : "DEN", scheduledArrivalTime : dateUtil(new Date(), 2, "hours")},
            {departureCode : "DEN", scheduledDepartureTime : dateUtil(new Date(), 150, "minutes"), arrivalCode : "ATL",  scheduledArrivalTime : dateUtil(new Date(), 5, "hours")},
            {departureCode : "ATL", scheduledDepartureTime : dateUtil(dateUtil(new Date(), 5, "hours"), 30, "minutes"), arrivalCode : "JFK",  scheduledArrivalTime : dateUtil(dateUtil(dateUtil(new Date(), 5, "hours"), 30, "minutes"), 1, "hours")}
        ]
    },
    {
        weekdays : ["M", 'T',"W","TH","F"],
        airline : "Southwest",
        legs : [
            {departureCode : "JFK", scheduledDepartureTime : new Date(), arrivalCode : "ORD", scheduledArrivalTime : dateUtil(new Date(), 2, "hours")},
            {departureCode : "ORD", scheduledDepartureTime : dateUtil(new Date(), 150, "minutes"), arrivalCode : "OMA",  scheduledArrivalTime : dateUtil(new Date(), 3, "hours")},
            {departureCode : "OMA", scheduledDepartureTime : dateUtil(dateUtil(new Date(), 3, "hours"), 30, "minutes"), arrivalCode : "DEN",  scheduledArrivalTime : dateUtil(dateUtil(new Date(), 4, "hours"), 30, "minutes")},
            {departureCode : "DEN", scheduledDepartureTime : dateUtil(new Date(), 5, "hours"), arrivalCode : "PHX",  scheduledArrivalTime : dateUtil(dateUtil(new Date(), 6, "hours"), 30, "minutes")},
            {departureCode : "PHX", scheduledDepartureTime : dateUtil(new Date(), 7, "hours"), arrivalCode : "LAS",  scheduledArrivalTime : dateUtil(dateUtil(new Date(), 7, "hours"), 30, "minutes")}
        ]
    },
    {
        weekdays : ["S","SU"],
        airline : "Southwest",
        legs : [
            {departureCode : "ABR", scheduledDepartureTime : new Date(), arrivalCode : "OMA", scheduledArrivalTime : dateUtil(new Date(), 38, "minutes")},
            {departureCode : "ABR", scheduledDepartureTime : dateUtil(new Date(), 68, "minutes"), arrivalCode : "ATL",  scheduledArrivalTime : dateUtil(new Date(), 3, "hours")}
        ]
    }
];
/***************************END MOCK DATA*********************/

exports.loadData = function() {
    var ret = new comb.Promise();
    var options = {
        connection : {user : "test", password : "testpass", database : 'airline', maxConnections: 100},
        dir : "./migrations",
        start : 0,
        up : false
    };
    //migrate down to clear any previous data
    moose.migrate(options)
            //migrate up to create tables
            .chain(comb.hitch(moose, "migrate", comb.merge({}, options, {up : true})), comb.hitch(ret, "errback"))
            .chain(models.load, comb.hitch(ret, "errback"))
            .then(function() {
                //now load out data
                var Airport = moose.getModel("airport"), AirplaneType = moose.getModel("airplane_type"), Flight = moose.getModel("flight");
                Airport.save(airports)
                        .chain(comb.hitch(AirplaneType, "save", airplaneTypes), comb.hitch(ret, "errback"))
                        .chain(comb.hitch(Flight, "save", flights), comb.hitch(ret, "errback"))
                        .then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));
            }, comb.hitch(ret, "errback"));
    return ret;
};