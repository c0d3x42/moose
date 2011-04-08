var classCounter = 0;

var callSuper = function(args, a, count) {
    var f = "", passedArgs = [], u;
    var name, caller, m, meta = this.__meta;
    count = count || 0;
    if (typeof args == "string") {
        f = args;
        args = a;
    } else {
        caller = args.callee;
        f = caller.nom;
        u = caller._unique || "define-1";
    }
    if (!f) {
        throw new Error("can't deduce a name to call super()");
    } else if (f != meta.superName) {
        //if the inheritace stopped early last time then we need to reset;
        meta.superPos = 0;
        meta.superName = f;
    }
    var supers = meta.supers, l = meta.supers.length;
    for (var i = meta.superPos; i < l; i++) {
        var super = supers[i];
        if (super && super[f] && super[f]._unique != u) {
            m = super[f];
            break;
        }
    }

    meta.superPos = i == 0 ? 1 : i;
    if (meta.superPos >= l) {
        meta.superPos = 0;
    }
    if (m) {
        var ret = m.apply(this, args);
        return ret;
    } else {
        meta.superPos = 0;
        return null;
    }
};

var addGetter = function(child, name, callback) {
    child.prototype.__defineGetter__(name, callback);
};

var addSetter = function(child, name, callback) {
    child.prototype.__defineSetter__(name, callback);
};

var mixin = function() {
    var mixins = Array.prototype.slice.call(arguments);
    var child = this.prototype, bases = child.__meta.bases, staticBases = bases.slice(), constructor = child.constructor;;
    for (var i = 0; i < mixins.length; i++) {
        var m = mixins[i];
        var proto = m.prototype.__meta.proto, operations;
        operations = proto.setters;
        if (operations) {
            for (var j in operations) {
                child.__defineSetter__(j, operations[j]);
            }
        }
        operations = proto.getters;
        if (operations) {
            for (j in operations) {
                child.__defineGetter__(j, operations[j]);
            }
        }
        var instanceMethods = proto.instance;
        if (instanceMethods) {
            for (j in instanceMethods) {
                if (!child[j] || (child[j]._unique != constructor._unique)) {
                    child[j] = instanceMethods[j];
                }
            }
        }
        var staticMethods = proto.static;
        if (staticMethods) {
            for (j in staticMethods) {
                if (!this[j] || (this[j]._unique != constructor._unique)) {
                    this[j] = staticMethods[j];
                }
            }
        }
        //copy the bases for static,
        var staticSupers = this.__meta.supers, supers = child.__meta.supers;
        child.__meta.supers = mixinSupers(m.prototype, bases).concat(supers);
        this.__meta.supers = mixinStaticSupers(m, staticBases).concat(staticSupers);
    }
    return this;
};

var mixinSupers = function(super, bases) {
    var arr = [], unique = super.constructor._unique;;
    //check it we already have this super mixed into our prototype chain
    //if true then we have already looped their supers!
    if (bases.indexOf(unique) == -1) {
        arr.push(super);
        //add their id to our bases
        bases.push(unique);
        var supers = super.__meta.supers, l = supers.length;
        if (supers && l) {
            for (var i = 0; i < l; i++) {
                arr = arr.concat(mixinSupers(supers[i], bases));
            }
        }
    }
    return arr;
};

var mixinStaticSupers = function(super, bases) {
    var arr = [], unique = super.prototype.constructor._unique;
    if (bases.indexOf(unique) == -1) {
        arr.push(super);
        bases.push(unique);
        var supers = super.__meta.supers, l = supers.length;
        if (supers && supers.length) {
            for (var i = 0; i < l; i++) {
                arr = arr.concat(mixinStaticSupers(supers[i], bases));
            }
        }
    }
    return arr;
};

exports.define = function(super, proto) {
    var mixins = [], proto = proto || {};
    var child = function() {
        //if a unique wasnt defined then the
        //child didnt define one!
        var instance = this.__meta.proto.instance;
        if (instance && instance.constructor._unique) {
            instance.constructor.apply(this, arguments);
        } else {
            this.super("constructor", arguments);
        }

    };
    var childProto = child.prototype, supers = [];
    if (super instanceof Array) {
        supers = super;
        super = supers.shift();

    }
    var bases = [], meta, staticMeta;
    if (super) {
        child.__proto__ = super;
        childProto.__proto__ = super.prototype;
        meta = childProto.__meta = {
            supers : mixinSupers(super.prototype, bases),
            superPos : 0,
            superName : ""
        };
        staticMeta = child.__meta = {
            supers : mixinStaticSupers(super, []),
            superPos : 0,
            superName : ""
        };
    }else{
        meta = childProto.__meta = {
            supers : [],
            superPos : 0,
            superName : ""
        };
        staticMeta = child.__meta = {
            supers : [],
            superPos : 0,
            superName : ""
        };
    }
    meta.proto = proto;
    meta.mixins = [];
    var operations = proto.setters;
    if (operations) {
        for (var i in operations) {
            childProto.__defineSetter__(i, operations[i]);
        }
    }
    operations = proto.getters;
    if (operations) {
        for (i in operations) {
            childProto.__defineGetter__(i, operations[i]);
        }
    }
    var instanceMethods = proto.instance;
    if (instanceMethods) {
        for (i in instanceMethods) {
            var f = instanceMethods[i];
            if (typeof f == "function") {
                f.nom = i;
                f._unique = "define" + classCounter;
            }
            childProto[i] = f;
        }
    }
    var staticMethods = proto.static;
    if (staticMethods) {
        for (i in staticMethods) {
            var f = staticMethods[i];
            if (typeof f == "function") {
                f.nom = i;
                f._unique = "define" + classCounter;
            }
            child[i] = f;
        }
    }
    meta.bases = bases;
    staticMeta.bases = bases;
    childProto.constructor._unique == "define" + classCounter;
    if (supers.length) {
        mixin.apply(child, supers);
    }
    child.mixin = mixin;
    child.super = callSuper;
    childProto.super = callSuper;
    classCounter++;
    return child;
};