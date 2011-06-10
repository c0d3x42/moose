#Moose

##Overview

An ORM for node with these features:

* Migrations
* Associations
* Connection pooling
* Support for multiple databases   
* A plugin api, e.g., from examples/plugins/ExpressPlugin.js


```javascript
/*
* Very simple express routing for a model
* */
var moose = require("../../lib"), comb = require("comb");
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
```
    
## Installation

    npm install moose

##Usage

* [Moose](http://pollenware.github.com/moose/symbols/moose.html)
* [Connecting to a database.](http://pollenware.github.com/moose/symbols/moose.html#createConnection)
* Models
  * [Define a model](http://pollenware.github.com/moose/symbols/moose.html#addModel)
     * [Model Class](http://pollenware.github.com/moose/symbols/Model.html) returned from defining a model
  * [Associations](http://pollenware.github.com/moose/symbols/moose.plugins.AssociationPlugin.html)
  * [Querying](http://pollenware.github.com/moose/symbols/moose.plugins.QueryPlugin.html)
  * [Caching](http://pollenware.github.com/moose/symbols/moose.plugins.CachePlugin.html)
  * [Timestamp](http://pollenware.github.com/moose/symbols/moose.plugins.TimeStampPlugin.html)
* [Migrations](http://pollenware.github.com/moose/symbols/Migrations.html)
* Adapters
  * [mysql](http://pollenware.github.com/moose/symbols/moose.adapters.mysql.html)
     * [Types](http://pollenware.github.com/moose/symbols/moose.adapters.mysql.types.html)

##License

MIT <https://github.com/Pollenware/moose/raw/master/LICENSE>


##Meta

* Code: `git clone git://github.com/pollenware/moose.git`
* JsDoc: <http://pollenware.github.com/moose>
* Website:  <http://pollenware.com> - Twitter: <http://twitter.com/pollenware> - 877.465.4045
