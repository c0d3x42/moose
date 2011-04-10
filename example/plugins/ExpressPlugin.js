var moose = require("../../lib"), comb = require("comb");

/*
* Very simple express routing for a model
* */
module.exports = exports = comb.define(null, {
   static : {

       route : function(app){
           app.get("/" + this.tableName + "/:id", comb.hitch(this, function(req, res){
               var id = req.params.id;
               this.findById(id).then(function(model){
                   var response;
                   if(model){
                       response = model.toObject();
                   }else{
                       response = {error : "Could not find a model with id " + id};
                   }
                   res.send(response);
               });
           }));
       }
   }
});