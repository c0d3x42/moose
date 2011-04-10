var moose = require("../../lib"), comb = require("comb");



//all needed tables
var tables = ["leg_instance","flight_leg","flight","airplane","airplane_type","can_land","airport"];
/*
* Helper function to load our models
* */
exports.load = function(){
  var ret = new comb.Promise();
  //load the tables so they are directly available for our models
  moose.loadSchemas(tables).then(function(){
      //now that the tables are loaded load the models!
      require("./Airport");
      require("./CanLand");
      require("./AirplaneType");
      require("./AirPlane");
      require("./FlightLeg");
      require("./LegInstance");
      require("./Flight");
      ret.callback();
  }, comb.hitch(ret, "errback"));
  return ret;
};