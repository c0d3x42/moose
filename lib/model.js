var comb = require("comb"),
        plugins = require("./plugins"),
        AssociationPlugin = plugins.AssociationPlugin,
        QueryPlugin = plugins.QueryPlugin,
        Promise = comb.Promise,
        PromiseList = comb.PromiseList;


var Model = comb.define(null, {
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
            m._hook("post", "load").then(comb.hitch(promise, "callback", m));

            return promise;

        },

        create : function(values) {
            //load an object from an object
            return new this(values);
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
 *      instance.getters  : Object?
 *      instance.setters  : Object?
 *      static   : Object?
 *      static.getters  : Object?
 *      static.setters  : Object?
 *      pre      : Object?
 *      post     : Object?
 *  }
 *
 *  example proto
 *
 *  {
 *      plugins : [PLUGIN1, PLUGIN1, PLUGIN3]
 *      instance : {
 *          myInstanceMethod : funciton(){},
 *          getters : {
 *              myProp : function(){
 *                  return prop;
 *              }
 *          },
 *
 *          setters : {
 *              myProp : function(val){
 *                   prop = val;
 *              }
 *          }
 *      },
 *
 *      static : {
 *          myStaticMethod : function(){
 *
 *          },
 *
 *           getters : {
 *              myStaticProp : function(){
 *                  return prop;
 *              }
 *          },
 *
 *          setters : {
 *              myStaticProp : function(val){
 *                   prop = val;
 *              }
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
            __hooks : {pre : {}, post : {}},
            getters : {
                primaryKey : function() {
                    return this.table.pk;
                }
            },
            setters : {}
        },
        static : {
            getters : {
                table : function() {
                    return table;
                },

                tableName : function() {
                    return table.tableName;
                },

                moose : function() {
                    return moose;
                },

                type : function() {
                    return table.type;
                }
            },
            setters : {}
        }
    };
    var instance = proto.instance,
            getters = instance.getters,
            setters = instance.setters,
            static = proto.static,
            staticGetters = proto.getters,
            staticSetters = proto.setters,
            modelInstance = modelOptions.instance || {},
            modelGetters = modelInstance.getters || {},
            modelSetters = modelInstance.setters || {},
            modelStatic = modelOptions.static || {},
            modelStaticGetters = modelStatic.getters || {},
            modelStaticSetters = modelStatic.setters || {};
    //remove these so they dont override our proto
    delete modelInstance.getters;
    delete modelInstance.setters;
    delete modelStatic.getters;
    delete modelStatic.setters;
    //Mixin the column setter/getters
    var columns = table.columns;
    for (var i in columns) {
        var col = columns[i];
        getters[i] = addGetter(i);
        setters[i] = addSetter(i, col);
    }

    //Define super and mixins
    //By Default we include Query and Association plugins
    var parents = [Model].concat([comb.plugins.Middleware, QueryPlugin, AssociationPlugin]).concat(modelOptions.plugins || []);

    //START MERGE OF PASSED PROTO
    var merge = comb.merge;

    merge(instance, modelInstance);
    merge(getters, modelGetters);
    merge(setters, modelSetters);
    merge(static, modelStatic);
    merge(staticGetters, modelStaticGetters);
    merge(staticSetters, modelStaticSetters);
    //END MERGE OF PASSED PROTO
    //Create return model
    var model = comb.define(parents, proto);
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
};


