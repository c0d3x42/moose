var comb = require("comb"),
        hitch = comb.hitch,
        dataset = require("../dataset"),
        Promise = comb.Promise,
        PromiseList = comb.PromiseList,
        Hive = require("hive-cache");


var hive = new Hive();

var i = 0;

/**
 * @class Adds in memory caching support for models.
 *
 * @example
 *
 * var MyModel = moose.addModel("testTable", {
 *     plugins : [moose.plugins.CachePlugin];
 * });
 *
 * //NOW IT WILL CACHE
 *
 * @name CachePlugin
 * @memberOf moose.plugins
 */
exports.CachePlugin = comb.define(null, {
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
            hive.replace(this.tableName + this.primaryKeyValue, this);
            next();
        },

        update : function(options, errback) {
            var ret = new Promise();
            this.super(arguments).then(hitch(this, function(val) {
                hive.remove(this.table + this.primaryKeyValue, val);
                ret.callback(val);
            }), hitch(ret, "errback"));
            return ret;
        },

        remove : function(errback) {
            hive.remove(this.primaryKeyValue);
            var ret = this.super(arguments);
            return ret;
        },


        getters : {
            tableName : function() {
                return this.table.tableName;
            }
        }

    },

    static : {

        findById : function(id) {
            var cached = hive.get(this.tableName + id);
            if (!cached) {
                console.log("not CAHCED");
                return this.super(arguments);
            } else {
                var ret = new Promise();
                ret.callback(cached);
                return ret;
            }
        }
    }
});