var callSuper = function(args, a, count) {
    var f = "", passedArgs = [];
    var name, caller, m;
    count = count || 0;
    if (typeof args == "string") {
        f = args;
        args = a;
    }
    caller = args.callee;
    f = caller.nom;
    if (!f) {
        throw new Error("can't deduce a name to call super()");
    }
    var l = this.__supers.length;
    for (var i = this.__superPos; i < l; i++) {
        var super = this.__supers[i];
        if (f && super && super.prototype[f]) {
            this.__superPos++;
            m = super.prototype[f];
            break;
        }
    }

    if (m) {
        return m.apply(this, args);
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
    for (var i in mixins) {
        var proto = mixins[i].prototype.__proto;
        var operations = proto.setters
        if (operations) {
            for (var j in operations) {
                child.prototype.__defineSetter__(j, operations[j]);
            }
        }
        operations = proto.getters
        if (operations) {
            for (j in operations) {
                child.prototype.__defineGetter__(j, operations[j]);
            }
        }
        var instanceMethods = proto.instance;
        if (instanceMethods) {
            for (j in instanceMethods) {
                child.prototype[j] = instanceMethods[j];
            }
        }
        var staticMethods = proto.static;
        if (staticMethods) {
            for (j in staticMethods) {
                child[j] = staticMethods[j];
            }
        }
    }
    this.prototype.__mixins.push(mixins);
    return this;
};

var mixinSupers = function(super, i) {
    i = i || 0
    var arr = [super];
    var supers = super.prototype.__supers;
    if (supers && supers.length) {
        for (var i in supers) {
            arr = arr.concat(mixinSupers(supers[i], i++))
        }
    }
    return arr;
}

exports.define = function(super, proto) {
    var child = function() {
        if (this.__supers) {
            for (var i in this.__supers) {
                var s = this.__supers[i];
                if (s != super) {
                    if (s.prototype.instance && s.prototype.instance.constructor) {
                        s.prototype.instance.constructor.apply(this, arguments);

                    }
                }
            }
            if (super) {
                super.apply(this, arguments);
            }

        }
        if (proto.instance && proto.instance.constructor) {
            proto.instance.constructor.apply(this, arguments);
        }

    };
    if (super) {
        child.__proto__ = super;
        child.prototype.__proto__ = super.prototype;
        var supers = mixinSupers(super);
        child.prototype.__supers = supers;
        child.prototype.__superPos = 0;
    } else {
        child.prototype.__supers = null;
    }
    child.prototype.__proto = proto;
    child.prototype.__mixins = [];
    var operations = proto.setters
    if (operations) {
        for (var i in operations) {
            child.prototype.__defineSetter__(i, operations[i]);
        }
    }
    operations = proto.getters
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
            }
            child.prototype[i] = f;
        }
    }
    var staticMethods = proto.static;
    if (staticMethods) {
        for (i in staticMethods) {
            child[i] = staticMethods[i];
        }
    }
    child.mixin = mixin;
    child.prototype.super = callSuper;
    return child;
};