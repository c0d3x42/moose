var Promise = function() {
    var fired = false,
            results = null, error = null;
    var cbs = [], errorCbs = [];
    var self = this;
    var resolve = function(error) {
        if (fired) {
            throw new Error("Already fired!");
        }
        fired = true;
        for (var i in cbs) {
            cbs[i].apply(self, results);
        }
        if (error) {
            for (i in errorCbs) {
                errorCbs[i].apply(self, error);
            }
        }

    };

    this.addCallback = function(cb) {
        if (cb) {
            if (fired) {
                cb.apply(this, results);
            } else {
                cbs.push(cb);
            }
        }
        return this;
    };

    this.addErrback = function(cb) {
        if (cb) {
            if (fired && error) {
                cb.apply(this, error);
            } else {
                errorCbs.push(cb);
            }
        }
    };

    this.callback = function() {
        if (fired) {
            throw new Error("Already fired!");
        }
        results = Array.prototype.slice.call(arguments);
        resolve();
        return this;
    };

    this.errback = function(i) {
        if (fired) {
            throw new Error("Already fired!");
        }
        error = Array.prototype.slice.call(arguments);
        resolve();
        return this;
    };

    this.then = function(callback, errback) {
        this.addCallback(callback);
        this.addErrback(errback);
        return this;
    };

    this.chain = function(callback, errback) {
        var promise = new Promise();
        this.addCallback(function(results) {
            callback.call(this, results).then(hitch(promise, "callback"));
        });
        this.addErrback(errback);
        return promise;
    }
};

var PromiseList = function(defs) {
    var results = [],
            errors = [],
            fired = false,
            defLength = defs.length,
            firedLength = 0,
            cbs = [],
            errorCbs = [];
    var self = this;

    var resolve = function(error) {
        if (fired) {
            throw new Error("Already fired!");
        }
        fired = true;
        for (var i in cbs) {
            cbs[i].call(self, results);
        }
        if (errors.length) {
            for (i in errorCbs) {
                errorCbs[i].call(self, errors);
            }
        }

    };

    this.addCallback = function(cb) {
        if (cb) {
            if (fired) {
                cb.call(this, results);
            } else {
                cbs.push(cb);
            }
        }
        return this;
    };

    this.addErrback = function(cb) {
        if (cb) {
            if (fired && errorCbs.length) {
                cb.call(this, errors);
            } else {
                errorCbs.push(cb);
            }
        }
        return this;
    };

    this.callback = function(i) {
        if (fired) {
            throw new Error("Already fired!");
        }
        results[i] = (Array.prototype.slice.call(arguments));
        firedLength++;
        if (firedLength == defLength) {
            resolve();
        }
        return this;
    };

    this.errback = function(i) {
        if (fired) {
            throw new Error("Already fired!");
        }
        error[i] = Array.prototype.slice.call(arguments);
        firedLength++;
        if (firedLength == defLength) {
            resolve();
        }
        return this;
    };

    this.then = function(callback, errback) {
        this.addCallback(callback);
        this.addErrback(errback);
        return this;
    };

    this.chain = function(callback, errback) {
        var promise = new Promise();
        this.addCallback(function(results) {
            callback.call(this, results).then(hitch(promise, "callback"));
        });
        this.addErrback(errback);
        return promise;
    };

    for (var i in defs) {
        (function(i) {
            defs[i].addCallback(function() {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(i);
                self.callback.apply(self, args);
            });
        })(i);
    }
};


exports.Promise = Promise;
exports.PromiseList = PromiseList;