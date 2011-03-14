var utility = require("../util"),
        hitch = utility.hitch,
        dataset = require("../dataset"),
        promise = require("../promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList;

var getDataset = function(model, table, hydrate) {
    if (typeof hydrate == "undefined") {
        hydrate = true;
    }
    if (hydrate) {
        return dataset.getDataSet(table.tableName, model.moose.getConnection(), table.type, model);
    } else {
        return dataset.getDataSet(table.tableName, model.moose.getConnection(), table.type);
    }
};

var proxyDataset = function(op, hydrate) {
    return function(options, callback, errback) {
        if (typeof options == "function") {
            callback = options;
            errback = callback;
            options = null;
        }
        var dataset = getDataset(this, this.table, hydrate);
        if (typeof options == "object") {
            dataset.find(options)
        } else {
            callback = options;
            errback = callback;
        }
        return dataset[op](callback, errback);
    };
};

exports.QueryPlugin = utility.define(null, {
    instance : {

        reload : function() {
            var pk = this.primaryKey;
            var q = {};
            q[pk] = this[pk];
            var retPromise = new Promise();
            getDataset(this.constructor, this.table).find(q).one().then(hitch(this, function(company) {
                retPromise.callback(company);
            }), hitch(retPromise, "errback"));
            return retPromise;
        },

        remove : function(errback) {
            var pk = this.primaryKey;
            if (pk) {
                var q = {};
                q[pk] = this[pk];
            } else {
                q = this.toSql();
            }
            var retPromise = new Promise();
            this.__callHook("pre", "remove").then(hitch(this, function() {
                var dataset = getDataset(this, this.table);
                dataset.remove(null, q).exec().then(hitch(this, function(results) {
                    this.__isNew = true;
                    var columns = this.table.columns, ret = {};
                    for (var i in columns) {
                        this["_" + i] = null;
                    }
                    this.__callHook("post", "remove").then(hitch(retPromise, "callback"));
                    dataset.close();
                }), hitch(retPromise, "errback"));
            }), hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        update : function(options, errback) {
            if (!this.__isNew && this.__isChanged) {
                for (var i in options) {
                    if (this.table.validate(i, options[i])) {
                        this[i] = options;
                    }
                }
                var pk = this.primaryKey;
                var q = {};
                q[pk] = this[pk];
                var retPromise = new Promise();
                this.__callHook("pre", "update").then(hitch(this, function() {
                    var dataset = getDataset(this, this.table);
                    dataset.update(this.toSql(), q).exec().then(hitch(this, function() {
                        this.__isChanged = false;
                        this.__callHook("post", "update").then(hitch(this, function() {
                            retPromise.callback(this);
                        }));
                        dataset.close();
                    })),hitch(retPromise, "errback");
                }));
                retPromise.addErrback(errback);
                return retPromise;
            } else if (this.__isNew && this.__isChanged) {
                return this.save(options, errback);
            } else {
                throw new Error("Cannot call update on an unchanged object")
            }
        },

        save : function(options, errback) {
            var pk = this.primaryKey, thisPk = null;
            if (options) {
                for (var i in options) {
                    this[i] = options;
                }
            }
            thisPk = this.primaryKeyValue;
            if (this.__isNew) {
                var retPromise = new Promise();
                this.__callHook("pre", "save").then(hitch(this, function() {
                    getDataset(this, this.table).save(this.toSql(), !thisPk).addCallback(hitch(this, function(res) {
                        this.__isNew = false;
                        this.__isChanged = false;
                        if (pk && !thisPk) {
                            this[pk] = this.table.columns[pk].fromSql(res);
                        }
                        this.__callHook("post", "save").then(hitch(this, function() {
                            retPromise.callback(this);
                        }));
                    })).addErrback(hitch(retPromise, "errback"));
                }));
                retPromise.addErrback(errback);
                return retPromise;
            } else {
                return this.update(options, errback);
            }
        },

        toSql : function() {
            var columns = this.table.columns, ret = {};
            for (var i in columns) {
                ret[i] = columns[i].toSql(this[i]);
            }
            return ret;
        }

    },

    static : {
        filter : function(options, hydrate) {
            return getDataset(this, this.table, hydrate).find(options);
        },

        findById : function(id){
            var pk = this.table.primaryKey;
            var q = {};
            q[pk] = id;
            return this.filter(q).one();
        },

        update : function(vals, /*?object*/options, /*?callback*/callback, /*?function*/errback) {
            var args = Array.prototype.slice.call(arguments);
            var dataset = getDataset(this, this.table);
            if (args.length > 1) {
                vals = args[0];
                options = args[1];
                if (typeof options == "function") {//then execute right away we have a callback
                    callback = options;
                    if (args.length == 3) errback = args[2];
                    var retPromise = new Promise();
                    dataset.update(vals).exec().then(function() {
                        retPromise.callback(true);
                        dataset.close();
                    }, hitch(retPromise, "errback"));
                    retPromise.then(callback, errback);
                    return retPromise;
                } else if (typeof options == "object") {
                    if (args.length > 2) {
                        callback = args[2];
                    }
                    if (args.length == 4) errback = args[3];
                    dataset.update(vals, options);
                    if (callback || errback) {
                        retPromise = new Promise();
                        dataset.exec().then(function() {
                            retPromise.callback(true);
                            dataset.close();
                        }, hitch(retPromise, "errback"));
                        retPromise.then(callback, errback);
                        return retPromise;
                    }
                }
            } else if (args.length == 1) {
                //then just call update and let them manually
                //execute it later by calling exec or a
                //command function like one, all, etc...
                return dataset.update(args[0]);
            }
            return dataset;
        },

        remove : function(q, errback) {
            var retPromise = new Promise();
            //first find all records so we call alert all associations and all other crap that needs to be
            //done in middle ware
            var p = new Promise();
            var pls = [];
            getDataset(this, this.table).find(q).all(function(items) {
                //todo this sucks find a better way!
                var pl = items.map(function(r) {
                    return r.remove()
                })
                new PromiseList(pl).then(hitch(p, "callback"), hitch(p, "errback"))
            }, hitch(p, "errback"));
            p.addErrback(errback);
            return p;
        },

        save : function(options, errback) {
            var ps;
            if (options instanceof Array) {
                ps = options.map(function(o) {
                    return this.save(o);
                }, this);
                var pl = new PromiseList(ps)
                pl.addErrback(errback);
                return pl;
            } else {
                var promise = new Promise();
                this.load(options).then(function(m) {
                    m.save().then(hitch(promise, "callback"));
                }, hitch(promise, "errback"));
                promise.addErrback(errback);
                return promise;
            }
        },

        count : function(callback, errback) {
            var ret = new Promise();
            getDataset(this, this.table).count().one(function(count) {
                ret.callback(count.count);
            }, hitch(ret, "errback"));
            ret.then(callback, errback);
            return ret;
        },

        getDataset : function() {
            return getDataset(this, this.table, false);
        },


        all : proxyDataset("all"),
        forEach : proxyDataset("forEach"),
        first : proxyDataset("first"),
        one : proxyDataset("one"),
        last : proxyDataset("last")
    }
});