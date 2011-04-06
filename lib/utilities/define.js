var classCounter = 0;

var callSuper = function(args, a, count) {
    var f = "", passedArgs = [], u;
    var name, caller, m;
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
    }else if(f != this.__superName){
        //if the inheritace stopped early last time then we need to reset;
        this.__superPos = 0;
        this.__superName = f;
    }
    var l = this.__supers.length;
    for (var i = this.__superPos; i < l; i++) {
        var super = this.__supers[i];
        if (f && super && super[f] && super[f]._unique != u) {
            m = super[f];
            break;
        }
    }

    this.__superPos = i == 0 ? 1 : i;
    if (this.__superPos >= l) {
        this.__superPos = 0;
    }
    if (m) {
        var ret = m.apply(this, args);
        return ret;
    } else {
        this.__superPos = 0;
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
    var child = this;
    var bases = this.prototype.constructor._bases, staticBases = bases.slice();
    for (var i in mixins) {
        var proto = mixins[i].prototype.__proto;
        var operations = proto.setters;
        if (operations) {
            for (var j in operations) {
                child.prototype.__defineSetter__(j, operations[j]);
            }
        }
        operations = proto.getters;
        if (operations) {
            for (j in operations) {
                child.prototype.__defineGetter__(j, operations[j]);
            }
        }
        var instanceMethods = proto.instance;
        if (instanceMethods) {
            for (j in instanceMethods) {
                if (!child.prototype[j] || (child.prototype[j]._unique != this.prototype.constructor._unique)) {
                    child.prototype[j] = instanceMethods[j];
                }
            }
        }
        var staticMethods = proto.static;
        if (staticMethods) {
            for (j in staticMethods) {
                if (!child[j] || (child[j]._unique != this.prototype.constructor._unique)) {
                    child[j] = staticMethods[j];
                }
            }
        }
        //copy the bases for static
        this.prototype.__supers = mixinSupers(mixins[i].prototype, bases).concat(this.prototype.__supers);
        this.__supers = mixinStaticSupers(mixins[i], staticBases).concat(this.__supers);
    }
    return this;
};

var mixinSupers = function(super, bases) {
    var arr = [];
    //check it we already have this super mixed into our prototype chain
    //if true then we have already looped their supers!
    if (bases.indexOf(super.constructor._unique) == -1) {
        arr.push(super);
        //add their id to our bases
        bases.push(super.constructor._unique);
        var supers = super.__supers;
        if (supers && supers.length) {
            for (var i in supers) {
                arr = arr.concat(mixinSupers(supers[i], bases));
            }
        }
    }
    return arr;
};

var mixinStaticSupers = function(super, bases) {
    var arr = [];
    if (bases.indexOf(super.prototype.constructor._unique) == -1) {
        arr.push(super);
        bases.push(super.prototype.constructor._unique);
        var supers = super.__supers;
        if (supers && supers.length) {
            for (var i in supers) {
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
        if (this.__proto.instance && this.__proto.instance.constructor._unique) {
            this.__proto.instance.constructor.apply(this, arguments);
        } else {
            this.super("constructor", arguments);
        }

    };
    if (super instanceof Array) {
        var supers = super;
        super = supers.shift();
        mixins = supers;

    }
    var bases = [];
    if (super) {
        child.__proto__ = super;
        child.prototype.__proto__ = super.prototype;
        //todo move this to a construcot cache
        child.prototype.__supers = mixinSupers(super.prototype, bases);
        child.prototype.__superPos = 0;
        child.prototype.__superName = "";
        child.__supers = mixinStaticSupers(super, []);
        child.__superPos = 0;
        child.__superName = "";
    } else {
        //todo move this to a construcot cache
        child.prototype.__supers = [];
        child.prototype.__superPos = 0;
        child.prototype.__superName = "";
        child.__supers = [];
        child.__superPos = 0;
        child.__superName = "";
    }
    child.prototype.__proto = proto;
    child.prototype.__mixins = [];
    var operations = proto.setters;
    if (operations) {
        for (var i in operations) {
            child.prototype.__defineSetter__(i, operations[i]);
        }
    }
    operations = proto.getters;
    if (operations) {
        for (i in operations) {
            child.prototype.__defineGetter__(i, operations[i]);
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
            child.prototype[i] = f;
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
    child.prototype.constructor._bases = bases;
    child.prototype.constructor._unique == "define" + classCounter;
    if (mixins.length) {
        mixin.apply(child, mixins);
    }
    child.mixin = mixin;
    child.super = callSuper;
    child.prototype.super = callSuper;
    classCounter++;
    return child;
};