var utility = require("./util"),
        plugins = require("./plugins"),
        AssociationPlugin = plugins.AssociationPlugin,
        QueryPlugin = plugins.QueryPlugin;


var Model = utility.define(null, {
    instance : {

        /*
         * public - read only
         *
         * Table
         *
         * the table this model represent
         * */
        table : null,

        /*
         *   moose  - read only
         *
         *   The parent moose
         */
        moose : null,

        /*
         * public - read only
         *
         * String
         *
         * The db type such as mysql
         * */
        type : null,

        /*
         * private - read only
         *
         * Boolean
         *
         * Whether or not this model is new
         * */
        __isNew  : true,

        /*
         * private
         *
         * Signifies if the model has changed
         * */
        __isChanged : false,

        /*
         * protected
         *
         * Avaiable callbacks
         * */
        _hooks : null,

        /*
         * private
         *
         * Object containing the hook methods
         * */
        __hooks : null,

        /*
         * Default onstructor
         * */
        constructor : function(options) {
            if (options) {
                for (var i in options) {
                    this[i] = options[i];
                }
            }
        },

        /*
         * private
         *
         * Call my hooks
         * */
        __callHook : function(state, op) {
            var promise = new Promise();
            if (this.__hooks[state] && this.__hooks[state][op]) {
                var funcs = this.__hooks[state][op], length = funcs.length;
                if (length) {
                    var count = 0;
                    var next = hitch(this, function() {
                        //if Ive looped through all of them callback
                        if (count == length) {
                            promise.callback();
                        } else {
                            //call next
                            funcs[count++].call(this, next);
                        }
                    });
                    next();
                } else {
                    promise.callback();
                }
            } else {
                promise.callback();
            }
            return promise;
        },

        /*
         * public
         *
         * Use to listen to before an event occured i.e. pre save
         * for Example model.post("save", callback);
         *
         * NOTE : Hooks are called in the order they are received!
         *
         * When connecting your callback will be called in the scope of the model.
         *
         * example : model.pre("save", function(next){
         *                 this.updated = new Date();
         *                 //you have to call next!!!!!
         *                 next();
         *          });
         * */
        pre : function(fun, callback) {
            if (this._hooks.indexOf(fun) != -1) {
                var hook = this.__hooks.pre[fun];
                if (!hook) {
                    hook = this.__hooks.pre[fun] = [];
                }
                hook.push(callback);
            } else {
                throw new Error(fun + " is not an avaiable hook function");
            }
        },

        /*
         * public
         *
         * Use to listen to after an event occured i.e. post save
         * for Example model.post("save", callback);
         *
         * NOTE : Hooks are called in the order they are received!
         *
         * When connecting your callback will be called in the scope of the model.
         *
         * example : model.post("save", function(next){
         *                 this.__isNew = false;
         *                 //you have to call next!!!!!
         *                 next();
         *          });
         * */
        post : function(fun, callback) {
            //is the hook supported?
            if (this._hooks.indexOf(fun) != -1) {
                var hook = this.__hooks.post[fun];
                //if I havent initialized it create it;
                if (hook == undefined) {
                    hook = this.__hooks.post[fun] = [];
                }
                hook.push(callback);
            } else {
                throw new Error(fun + " is not an avaiable hook function");
            }
        },

        /*
         * public
         *
         * @see Model.isValid
         * */
        isValid : function() {
            try {
                return this.table.validate(options);
            } catch(e) {
                return false;
            }
        },

        /*
         *  public
         * Returns an object that represents me.
         *
         **/
        toObject : function() {
            var columns = this.table.columns, ret = {};
            for (var i in columns) {
                ret[i] = this[i];
            }
            return ret;
        },

        /*
         * public
         *
         * Convert me to a JSON object
         **/
        toJson : function() {
            return JSON.stringify(this.toObject(), null, 4);
        }
    },

    getters : {
        /*Returns my actual primary key value*/
        primaryKeyValue : function() {
            return this[this.primaryKey];
        },

        /*Return if Im a new object*/
        isNew : function() {
            return this.__isNew;
        },

        /*Return if Im changed*/
        isChanged : function() {
            return this.__isChanged;
        }

    },

    static : {
        table : null,

        moose : null,

        isValid : function(options) {
            try {
                return this.table.validate(options);
            } catch(e) {
                //we dont actually want to throw an error just
                //return false
                return false;
            }
        },

        load : function(values) {
            //load an object from an object
            var promise = new Promise();

            var m = new this(this.table.fromSql(values));
            m.__callHook("post", "load").then(hitch(promise, "callback", m));

            return promise;

        },

        create : function(values) {
            //load an object from an object
            return new this(values);
        },


        pre : function(name, cb) {
            var hookMethods = this.prototype._hooks;
            var hooks = this.prototype.__hooks;
            if (hookMethods.indexOf(name) != -1) {
                var hook = hooks.pre[name];
                if (!hook) {
                    hook = hooks.pre[name] = [];
                }
                hook.push(cb);
            }
        },

        post : function(name, cb) {
            var hookMethods = this.prototype._hooks;
            var hooks = this.prototype.__hooks;
            if (hookMethods.indexOf(name) != -1) {
                var hook = hooks.post[name];
                if (!hook) {
                    hook = hooks.post[name] = [];
                }
                hook.push(cb);
            }
        }
    }

});

/*Adds a setter to an object*/
var addSetter = function(name, col) {
    return function(val) {
        col.check(val);
        if (!this.isNew) this.__isChanged = true;
        this["_" + name] = val;
    };
};

/*Adds a getter to an object*/
var addGetter = function(name) {
    return function() {
        return this["_" + name];
    };
};

/*
 * Factory for a new Model,
 * @Table - A Table class representing the table for this model
 * @Moose - the moose instance
 * @ModelOptions - Similar to define with a few other conveniences
 *  {
 *      plugins  : Array?
 *      instance : Object?
 *      getters  : Object?
 *      setters  : Object?
 *      static   : Object?
 *      pre      : Object?
 *      post     : Object?
 *  }
 *
 *  example proto
 *
 *  {
 *      plugins : [PLUGIN1, PLUGIN1, PLUGIN3]
 *      instance : {
 *          myInstanceMethod : funciton(){}
 *      },
 *      getters : {
 *          myProp : function(){
 *              return prop;
 *          }
 *      },
 *      setters : {
 *          myProp : function(val){
 *               prop = val;
 *          }
 *      },
 *
 *      static : {
 *          myStaticMethod : function(){
 *
 *          }
 *      },
 *
 *      pre : {
 *          save : function(){
 *
 *          }
 *      },
 *
 *      post : {
 *          save  : function(){
 *
 *          }
 *      }
 *  }
 *
 * */

exports.create = function(table, moose, modelOptions) {
    modelOptions = modelOptions || {};
    //Create the default proto
    var proto = {
        instance : {
            table : table,
            moose : moose,
            _hooks : ["save", "update", "remove", "load"],
            __hooks : {pre : {}, post : {}}
        },
        static : {
                    get table() {
                        return table;
                    },

                    get tableName() {
                        return table.tableName;
                    },

                    get moose() {
                        return moose;
                    },

                    get type() {
                        return table.type;
                    }
        },
        getters : {
            primaryKey : function() {
                return this.table.pk;
            }
        },
        setters : {}
    };
    //Mixin the column setter/getters
    var columns = table.columns;
    for (var i in columns) {
        var col = columns[i];
        proto.getters[i] = addGetter(i);
        proto.setters[i] = addSetter(i, col);
    }

    //Define super and mixins
    //By Default we include Query and Association plugins
    var parents = [Model].concat([QueryPlugin, AssociationPlugin]).concat(modelOptions.plugins || []);

    //START MERGE OF PASSED PROTO
    utility.merge(proto.getters, modelOptions.getters || {});
    utility.merge(proto.setters, modelOptions.setters || {});
    utility.merge(proto.static, modelOptions.static || {});
    utility.merge(proto.instance, modelOptions.instance || {});
    //END MERGE OF PASSED PROTO

    //Create return model
    var model = utility.define(parents, proto);
    //mixin pre and post functions
    ["pre","post"].forEach(function(op) {
        var optionsOp = modelOptions[op];
        if (optionsOp) {
            for (var i in optionsOp) {
                model[op](i, optionsOp[i]);
            }
        }
    });
    return model;
}


