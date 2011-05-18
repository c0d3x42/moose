var comb = require("comb"),
        plugins = require("./plugins"),
        AssociationPlugin = plugins.AssociationPlugin,
        QueryPlugin = plugins.QueryPlugin,
        Promise = comb.Promise,
        PromiseList = comb.PromiseList;


var Model = comb.define([QueryPlugin, AssociationPlugin, comb.plugins.Middleware], {
    instance : {
    /**
     * @lends Model.prototype
     */
        /**
         * The table this model represent
         * @type moose.Table
         * */
        table : null,

        /**
         * moose  - read only
         *
         * @type moose
         */
        moose : null,

        /**
         * The database type such as mysql
         *
         * @typre String
         *
         * */
        type : null,

        /**
         * Whether or not this model is new
         * */
        __isNew  : true,

        /**
         * Signifies if the model has changed
         * */
        __isChanged : false,

        /**
         * Base class for all models.
         * <p>This is used through {@link moose.addModel}, <b>NOT directly.</b></p>
         *
         * @constructs
         * @augments moose.plugins.QueryPlugin
         * @augments moose.plugins.AssociationPlugin
         * @augments comb.plugins.Middleware
         *
         * @param {Object} columnValues values of each column to be used by this Model.
         *
         * @property {*} primaryKeyValue the value of this models primaryKey
         * @property {Boolean} isNew true if this model is new and does not exist in the database.
         * @property {Boolean} isChanged true if the model has been changed and not saved.
         * */
        constructor : function(options) {
            if (options) {
                for (var i in options) {
                    this[i] = options[i];
                }
            }
        },

        /**
         *
         * Validate values against the model {@link moose.Table#validate}
         *
         * @returns {Boolean} true if the values are valid
         * */
        isValid : function(options) {
            try {
                return this.table.validate.apply(this.table, arguments);
            } catch(e) {
                return false;
            }
        },

        /**
         * Convert this model to an object, containing column, value pairs.
         *
         * @return {Object} the object version of this model.
         **/
        toObject : function() {
            var columns = this.table.columns, ret = {};
            for (var i in columns) {
                ret[i] = this[i];
            }
            return ret;
        },

        /**
         * Convert this model to JSON, containing column, value pairs.
         *
         * @return {JSON} the JSON version of this model.
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

    /**@lends Model*/

        /**
         * The table that this Model represents.
         */
        table : null,

        /**
         * moose  - read only
         *
         * @type moose
         */
        moose : null,

        /**
         *
         * Validate values against the Model {@link moose.Table#validate}
         *
         * @returns {Boolean} true if the values are valid
         * */
        isValid : function(options) {
            try {
                return this.table.validate(options);
            } catch(e) {
                //we dont actually want to throw an error just
                //return false
                return false;
            }
        },

        /**
         * Create a new model instance from sql values.
         *
         * @example
         *
         * var myModel = Model.load({
         *    myDate : "1999-01-01",
         *    intValue : "1"
         * });
         *
         * //intValue is converted to a number.
         * myModel.intValue => 1,
         * //mydate is converted to a date
         * myModel.myDate => new Date(1999,01,01);
         *
         * @param {Object} values object containing the values to initialize the model with.
         *
         * @returns {Model} instantiated model initialized with the values passed in.
         * */
        load : function(values) {
            //load an object from an object
            var promise = new Promise();
            var m = new this(this.table.fromSql(values));
            m._hook("post", "load").then(comb.hitch(promise, "callback", m));
            return promise;
        },

        /**
         * Create a new model initialized with the specified values.
         *
         * @param {Object} values  the values to initialize the model with.
         *
         * @returns {Model} instantiated model initialized with the values passed in.
         */
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
    var parents = [Model].concat(modelOptions.plugins || []);

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


