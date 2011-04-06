var moose = require("../../lib");

/*
* Very simple express routing for a model
* */
module.exports = exports = moose.define(null, {
   static : {

       route : function(app){
           app.get("/" + this.tableName + "/:id", moose.hitch(this, function(req, res){
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