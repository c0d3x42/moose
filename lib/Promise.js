/**
 * Promise Objects
 *      -Promise - a promise object
 *          - callback : resolve the promise, fires all registered callback
 *          - errback : resolve with error, fires all registerd errbacks
 *          - addCallback : adds a callback to the promise
 *          - addErrback : adds an errback to the promise
 *          - then : add both errback and callback
 *          - chain : adds callback and errback and returns a new promise,
 *                  - IMPORTANT the callback and errback must return a promise!
 *      -PromiseList - promise that fires after all contained promises are done
 *                   - Initilaize with a list of promises
 *                   -SEE PROMISE
 *
 *   Example : Simple promise
 *          var myFunc = function(){
 *              var promise = new Promise();
 *              //callback the promise after 10 Secs
 *              setTimeout(hitch(promise, "callback"), 10000);
 *              return promise;
 *          }
 *          var myFunc2 = function(){
 *              var promises =[];
 *              for(var i = 0; i < 10; i++){
 *                  promises.push(myFunc);
 *              }
 *              //create a new promise list with all 10 promises
 *              return new PromiseList(promises);
 *          }
 *
 *          myFunc.then(do something...)
 *          myFunc.addCallback(do something...)
 *          myFunc.cain(myfunc).then(do something...)
 *          myFunc.cain(myfunc).addCallback(do something...)
 *
 *          myFunc2.then(do something...)
 *          myFunc2.addCallback(do something...)
 *          myFunc2.cain(myfunc).then(do something...)
 *          myFunc2.cain(myfunc).addCallback(do something...)
 *
 *
 * */



var Promise = function() {
    var fired = false,
            results = null, error = null;
    var cbs = [], errorCbs = [];
    var self = this;
    var resolve = function() {
        if (fired) {
            throw new Error("Already fired!");
        }
        fired = true;
        if (!error) {
            for (var i in cbs) {
                cbs[i].apply(self, results);
            }
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
    };
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
        if (!errors.length) {
            for (var i in cbs) {
                cbs[i].call(self, results);

            }
        } else {

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
        errors[i] = Array.prototype.slice.call(arguments);
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
            defs[i].addErrback(function() {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(i);
                self.errback.apply(self, args);
            });
        })(i);
    }
};


exports.Promise = Promise;
exports.PromiseList = PromiseList;