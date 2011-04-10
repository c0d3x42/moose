var comb = require("comb"),
        hitch = comb.hitch,
        util = require('util'),
        adapters = require("./adapters"),
        Promise = comb.Promise,
        PromiseList = comb.PromiseList;


var Dataset = comb.define(null, {
    instance : {

        constructor: function(table, db, type, model) {
            if (!table) throw new Error("table is required by dataset");
            if (!db) throw new Error("db is required by dataset");
            //if(!model) throw new Error("model is required by dataset");
            this.super(arguments);
            this.model = model;
            this.type = type;
        },

        _load : function(results) {
            var promises = [], retPromise;
            promises = results.map(function(o) {
                var p = new Promise();
                if (this.model) {
                    var m = this.model.load(o).then(function(m) {
                        m.__isNew = false;
                        p.callback(m);
                    });
                } else {
                    p.callback(o);
                }
                return p;
            }, this);

            retPromise = new PromiseList(promises);
            return retPromise;
        },

        forEach : function(callback, errback, scope) {
            var retPromise = new Promise();
            if (callback) {
                this.all().addCallback(hitch(this, function(results) {
                    if (results && results.length) {
                        results.forEach(callback, scope);
                    } else {
                        results = null;
                        callback.call(scope || this, null);
                    }
                    retPromise.callback(results);
                })).addErrback(hitch(retPromise, "errback"));
                retPromise.addErrback(errback);
            } else {
                throw new Error("callback required");
            }
            return retPromise;
        },

        one : function(callback, errback) {
            var retPromise = new Promise();
            this.limit(1);
            this.exec().addCallback(hitch(this, function(results, fields) {
                if (results && results.length) {
                    results = this._load(results).then(hitch(this, function(results) {
                        results = results[0][1];
                        callback && callback(results);
                        retPromise.callback(results);
                    }));
                } else {
                    results = null;
                    callback && callback(results);
                    retPromise.callback(results);
                }

            })).addErrback(hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        first : function(callback, errback) {
            var retPromise = new Promise();
            this.exec().addCallback(hitch(this, function(results, fields) {
                if (results && results.length) {
                    results = this._load(results).then(hitch(this, function(results) {
                        results = results[0][1];
                        callback && callback(results);
                        retPromise.callback(results);
                    }));
                } else {
                    results = null;
                    callback && callback(results);
                    retPromise.callback(results);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        last : function(callback, errback) {
            var retPromise = new Promise();
            this.exec().addCallback(hitch(this, function(results, fields) {
                if (results && results.length) {
                    results = this._load(results).then(hitch(this, function(results) {
                        results = results[results.length - 1][1];
                        callback && callback(results);
                        retPromise.callback(results);
                    }));
                } else {
                    results = null;
                    callback && callback(results);
                    retPromise.callback(results);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;

        },

        all : function(callback, errback) {
            var retPromise = new Promise();
            this.exec().addCallback(hitch(this, function(results, fields) {
                if (results && results.length) {
                    results = this._load(results).then(hitch(this, function(results) {
                        results = results.map(function(r) {
                            return r[1];
                        });
                        callback && callback(results);
                        retPromise.callback(results);
                    }));
                } else {
                    callback && callback(results);
                    retPromise.callback(results);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        getLastInsertId : function(callback, errback) {
            var retPromise = new Promise();
            adapters[this.type].getLastInsertId(this.db).addCallback(hitch(this, function(results) {
                if (results) {
                    retPromise.callback(results[0].id);
                } else {
                    retPromise.callback(null);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.then(callback, errback);
            return retPromise;
        },

        save : function(vals, loadId, callback, errback) {
            var retPromise = new Promise();
            adapters[this.type].save(this.table, vals, this.db).addCallback(hitch(this, function(results) {
                if (loadId) {
                    retPromise.callback(results.insertId);
                } else {
                    retPromise.callback(results);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        run : function(callback, errback) {
            return this.all(callback, errback);
        }
    }
});


//returns a dataset for a particular type
exports.getDataSet = function(table, db, type, model) {
    var dataset = comb.define([adapters[type], Dataset], {});
    return new dataset(table, db, type, model);
};