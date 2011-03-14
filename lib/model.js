var utility = require("./util"),
        plugins = require("./plugins"),
        AssociationPlugin = plugins.AssociationPlugin,
        QueryPlugin = plugins.QueryPlugin;


var Model = utility.define(null, {
    instance : {

        table : null,

        moose : null,

        type : null,

        __isNew  : true,

        __isChanged : false,

        _hooks : null,

        __hooks : null,

        constructor : function(options) {
            if (options) {
                for (var i in options) {
                    this[i] = options[i];
                }
            }
        },

        __callHook : function(state, op) {
            var promise = new Promise();
            if (this.__hooks[state] && this.__hooks[state][op]) {
                var funcs = this.__hooks[state][op], length = funcs.length;
                if (length) {
                    var count = 0;
                    var next = hitch(this, function() {
                        if (count == length) {
                            return promise.callback.call(promise);
                        } else {
                            return funcs[count++].call(this, next);
                        }
                    });
                    next();
                }else{
                    promise.callback();
                }
            }else{
                promise.callback();
            }
            return promise;
        },

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

        post : function(fun, callback) {
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

        isValid : function() {
            try {
                return this.table.validate(options);
            } catch(e) {
                return false;
            }
        },

        toObject : function() {
            var columns = this.table.columns, ret = {};
            for (var i in columns) {
                ret[i] = this[i];
            }
            return ret;
        },

        toJson : function(pretty){
            return JSON.stringify(this.toObject(), null, 4);
        }
    },

    getters : {
        primaryKeyValue : function() {
            return this[this.primaryKey];
        },

        isNew : function() {
            return this.__isNew;
        },

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
                return false;
            }
        },

        load : function(values) {
            var promise = new Promise();
            var m;
            try {
                m = new this(values);
                promise.callback(m);
            } catch(e) {
                try {
                    m = new this(this.table.fromSql(values));
                    m.__callHook("post", "load").then(hitch(promise, "callback", m));
                } catch(e) {
                    throw e;
                }
            }
            return promise;

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


var addSetter = function(name, col) {
    return function(val) {
        col.check(val);
        if (!this.isNew) this.__isChanged = true;
        this["_" + name] = val;
    };
};

var addGetter = function(name) {
    return function() {
        return this["_" + name];
    };
};

exports.create = function(table, moose, modelOptions) {
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
                return this.table.primaryKey;
            }
        },
        setters : {}
    };
    var columns = table.columns;
    for (var i in columns) {
        var col = columns[i];
        proto.getters[i] = addGetter(i);
        proto.setters[i] = addSetter(i, col);
    }
    utility.merge(proto.getters, modelOptions.getters || {});
    utility.merge(proto.setters, modelOptions.setters || {});
    utility.merge(proto.static, modelOptions.static || {});
    utility.merge(proto.instance, modelOptions.instance || {});
    var model = utility.define(Model, proto);
    ["pre","post"].forEach(function(op) {
        var optionsOp = modelOptions[op];
        if (optionsOp) {
            for (var i in optionsOp) {
                model[op](i, optionsOp[i]);
            }
        }
    });
    model.mixin(QueryPlugin, AssociationPlugin);

    return model;
}


