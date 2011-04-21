var comb = require("comb");

var fetch = {
    LAZY : "lazy",
    EAGER : "eager"
};

/*
 * Base class for all associations, this class is not meant to be instantiated directly
 *
 * Options : model<String>          - a string to look up the model that we are associated with
 *           filter<function>       - a callback to find association if a filter is defined then
 *                                    the association is read only
 *           key<Object>            - object with left key and right key
 *           orderBy<String|Object> - how to order our association @see Dataset.order
 *           fetchType<object>      - the fetch type of the model if fetch.Eager is supplied then
 *                                    the associations are automatically filled, if fetch.Lazy is supplied
 *                                    then a promise is returned and is called back with the loaded models
 * */
module.exports = exports = comb.define(null, {
    instance : {

        //Our associatied model
        _model : null,

        //The key on this models class to look up
        leftKey : null,

        //The join key to look up on our associated model
        rightKey : null,

        //How to fetch our associations
        fetchType : fetch.LAZY,

        //how to order our association
        orderBy : null,

        //Our filter method
        filter : null,

        //Protected
        //Method to call to look up association,
        //called after the model has been filtered
        _fetchMethod : "all",

        //constructor
        constructor : function(options, moose) {
            if (!options.model) throw new Error("Model is required for oneToMany association");
            this._model = options.model;
            this.moose = moose;
            this.orderBy = options.orderBy;
            if (options.filter && typeof options.filter == "function") {
                this.filter = options.filter;
            } else {
                for (var i in options.key) {
                    this.leftKey = i;
                    this.rightKey = options.key[i];
                }
            }
            this.fetchType = options.fetchType || fetch.LAZY;
        },

        //isEager
        //returns true if our fetchType is eager
        isEager : function() {
            return this.fetchType == fetch.EAGER;
        },

        //Protected
        //_filter
        //returns a filtered dataset to load our associated property
        _filter : function(parent) {
            if (!this.filter) {
                var q = {};
                q[this.rightKey] = parent[this.leftKey];
                if (!this.orderBy) {
                    this.orderBy = this.model.primaryKey;
                }
                return this.model.filter(q).order(this.orderBy);
            } else {
                return this.filter.call(parent);
            }
        },


        //performs a fetch of our assiciated model
        //return Promise
        fetch :  function(parent) {
            return this._filter(parent)[this._fetchMethod]();
        },

        //todo: change hook methods to be in the association scope

        //Protected
        //Hook method called before our model is removed
        //NOTE called in the scope of the child class
        // THIS METHOD IS ONLY CALLED IF A FILTER IS NOT SUPPLIED
        _preRemove : function(next, self) {
            next();
        },

        //Protected
        //Hook method called after our model is removed
        //NOTE called in the scope of the child class
        // THIS METHOD IS ONLY CALLED IF A FILTER IS NOT SUPPLIED
        _postRemove : function(next, self) {
            next();
        },

        //Protected
        //Hook method called before our model is saved
        //NOTE called in the scope of the child class
        // THIS METHOD IS ONLY CALLED IF A FILTER IS NOT SUPPLIED
        _preSave : function(next, self) {
            next();
        },

        //Protected
        //Hook method called after our model is saved
        //NOTE called in the scope of the child class
        // THIS METHOD IS ONLY CALLED IF A FILTER IS NOT SUPPLIED
        _postSave : function(next, self) {
            next();
        },

        //Protected
        //Hook method called before our model is updated
        //NOTE called in the scope of the child class
        // THIS METHOD IS ONLY CALLED IF A FILTER IS NOT SUPPLIED
        _preUpdate : function(next, self) {
            next();
        },

        //Protected
        //Hook method called after our model is updated
        //NOTE called in the scope of the child class
        // THIS METHOD IS ONLY CALLED IF A FILTER IS NOT SUPPLIED
        _postUpdate : function(next, self) {
            next();
        },

        //Protected
        //Hook method called before our model is loaded
        //NOTE called in the scope of the child class
        _preLoad : function(next, self) {
            next();
        },

        //Protected
        //Hook method called after our model is loaded
        //NOTE called in the scope of the child class
        _postLoad : function(next, self) {
            next();
        },

        //Protected
        //Sets our association
        _setter : function(val, self) {
            this["_" + self.name] = val;
        },

        //Protected
        //Retrieves our association
        _getter : function(self) {
            return this["_" + self.name];
        },

        //Public
        //Called to inject a model object with an association
        //This sets up all required methods, such as hooks, setters and getters
        inject : function(parent, name) {
            this.loadedKey = "__" + name + "_loaded";
            this.name = name;
            var self = this;

            parent.prototype["_" + name] = [];
            parent.prototype[this.loadedKey] = false;

            parent.prototype.__defineGetter__(name, function() {
                return  self._getter.call(this, self);
            });
            parent.prototype.__defineGetter__(name + "Dataset", function() {
                return  this._filter();
            });
            if (!this.filter) {
                //define a setter because we arent read only
                parent.prototype.__defineSetter__(name, function(vals) {
                    self._setter.call(this, vals, self);
                });
            }

            //set up all callbacks
            ["pre", "post"].forEach(function(op) {
                ["save", "update", "remove", "load"].forEach(function(type) {
                    parent[op](type, function(next) {
                        return self["_" + op + type.charAt(0).toUpperCase() + type.slice(1)].call(this, next, self);
                    });
                }, this);
            }, this);
        },

        getters : {

            //Returns our model
            model : function() {
                return this.moose.getModel(this._model);
            }
        }
    },

    static : {
        //fetch methods
        fetch : fetch
    }
});