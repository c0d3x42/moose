var comb = require("comb");

var fetch = {
    LAZY : "lazy",
    EAGER : "eager"
};

/**
 * @class Base class for all associations.
 *
 * </br>
 * <b>NOT to be instantiated directly</b>
 * Its just documented for reference.
 *
 * @name _Association
 * @param {Object} options
 * @param {String} options.model a string to look up the model that we are associated with
 * @param {Function} options.filter  a callback to find association if a filter is defined then
 *                                    the association is read only
 * @param {Object} options.key object with left key and right key
 * @param {String|Object} options.orderBy<String|Object> - how to order our association @see Dataset.order
 * @param {fetch.EAGER|fetch.LAZY} options.fetchType the fetch type of the model if fetch.Eager is supplied then
 *                                    the associations are automatically filled, if fetch.Lazy is supplied
 *                                    then a promise is returned and is called back with the loaded models
 * @property {Model} model the model associatied with this association.
 * */
module.exports = exports = comb.define(null, {
			/**@ignore*/
    instance : {
    /**@lends _Association.prototype*/

        //Our associatied model
        _model : null,

        /**
         * The key on this models class to look up
         */
        leftKey : null,

        /**
         * The join key to look up on our associated model
         */
        rightKey : null,

        /**
         * Fetch type
         */
        fetchType : fetch.LAZY,

        /**how to order our association*/
        orderBy : null,

        /**Our filter method*/
        filter : null,

        /**
         *
         *Method to call to look up association,
         *called after the model has been filtered
         **/
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

        /**
         * @return {Boolean} true if the association is eager.
         */
        isEager : function() {
            return this.fetchType == fetch.EAGER;
        },

        /**
         *Filters our associated dataset to load our association.
         *
         *@return {Dataset} the dataset with all filters applied.
         **/
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


        /**
         *Filters and loads our association.
         *
         *@return {comb.Promise} Called back with the associations.
         */
        fetch :  function(parent) {
            return this._filter(parent)[this._fetchMethod]();
        },

        //todo: change hook methods to be in the association scope

        /**
         * Middleware called before a model is removed.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being acted up.
         */
        _preRemove : function(next, self) {
            next();
        },

        /**
         * Middleware called aft era model is removed.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being called.
         */
        _postRemove : function(next, self) {
            next();
        },

        /**
         * Middleware called before a model is saved.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being called.
         */
        _preSave : function(next, self) {
            next();
        },

        /**
         * Middleware called after a model is saved.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being called.
         */
        _postSave : function(next, self) {
            next();
        },

        /**
         * Middleware called before a model is updated.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being called.
         */
        _preUpdate : function(next, self) {
            next();
        },

        /**
         * Middleware called before a model is updated.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being called.
         */
        _postUpdate : function(next, self) {
            next();
        },

        /**
         * Middleware called before a model is loaded.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being called.
         */
        _preLoad : function(next, self) {
            next();
        },

        /**
         * Middleware called after a model is loaded.
         * </br>
         * <b> This is called in the scope of the model</b>
         * @param {Function} next function to pass control up the middleware stack.
         * @param {_Association} self reference to the Association that is being called.
         */
        _postLoad : function(next, self) {
            next();
        },

        /**
         * Alias used to explicitly set an association on a model.
         * @param {*} val the value to set the association to
         * @param {_Association} self reference to the Association that is being called.
         */
        _setter : function(val, self) {
            this["_" + self.name] = val;
        },

        /**
         * Alias used to explicitly get an association on a model.
         * @param {_Association} self reference to the Association that is being called.
         */
        _getter : function(self) {
            return this["_" + self.name];
        },

        /**
         * Method to inject functionality into a model. This method alters the model
         * to prepare it for associations, and initializes all required middleware calls
         * to fulfill requirements needed to loaded the associations.
         *
         * @param {Model} parent the model that is having an associtaion set on it.
         * @param {String} name the name of the association.
         */
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
        /**@lends _Association*/

        /**
         * Fetch types
         */
        fetch : {

            LAZY : "lazy",

            EAGER : "eager"
        }
    }
});