var utility = require("../util"),
        hitch = utility.hitch,
        dataset = require("../dataset"),
        promise = require("../promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        cache = require("./cache/cache");


/*
 * Adds in memory caching support
 *
 *
 * */
var i = 0;
exports.CachePlugin = utility.define(null, {
    instance : {

        constructor : function() {
            this.super(arguments);
            this.post("load", this._postLoad);
        },

        reload : function() {
            var ret = new Promise();
            this.super(arguments).then(hitch(this, function(m) {
                cache.replace(m.table + m.primaryKeyValue, m);
                ret.callback(m);
            }), hitch(ret, "errback"));
            return ret;
        },

        save : function() {
            return this.super(arguments);
        },

        _postLoad : function(next) {
            cache.replace(this.tableName + this.primaryKeyValue, this);
            next();
        },

        update : function(options, errback) {
            var ret = new Promise();
            this.super(arguments).then(hitch(this, function(val) {
                cache.remove(this.table + this.primaryKeyValue, val);
                ret.callback(val);
            }), hitch(ret, "errback"));
            return ret;
        },

        remove : function(errback) {
            cache.remove(this.primaryKeyValue);
            var ret = this.super(arguments);
            return ret;
        }

    },

    getters : {
        tableName : function() {
            return this.table.tableName;
        }
    },

    static : {

        findById : function(id) {
            var cached = cache.get(this.tableName + id);
            if (!cached) {
                console.log("not CAHCED");
                return this.super(arguments);
            } else {
                var ret = new Promise();
                ret.callback(cached);
                return ret;
            }
        },

        cache : function(options) {

        }
    }
});