var comb = require("comb"),
        hitch = comb.hitch,
		logging = comb.logging,
		Logger = logging.Logger,
        util = require('util'),
        Promise = comb.Promise,
        PromiseList = comb.PromiseList;

var moose, adapter;

/**
 * @class Wrapper for {@link SQL} adpaters to allow execution functions such as:
 * <ul>
 *     <li>forEach</li>
 *     <li>one</li>
 *     <li>all</li>
 *     <li>first</li>
 *     <li>last</li>
 *     <li>all</li>
 *     <li>save</li>
 * </ul>
 *
 * This class should be used insead of SQL directly, becuase:
 * <ul>
 *     <li>Allows for Model creation if needed</li>
 *     <li>Handles the massaging of data to make the use of results easier.</li>
 *     <li>Closing of database connections</li>
 * </ul>
 * @name Dataset
 * @augments SQL
 *
 *
 */

var LOGGER = Logger.getLogger("moose.Dataset");

var Dataset = comb.define(null, {
    instance : {
        /**@lends Dataset.prototype*/

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

        /**
         * Provide Array style looping a query results.
         *
         * @example
         * dataset.forEach(function(r, i){
         *     console.log("Row %d", i);
         * });
         *
         *
         * @param {Function} [callback] executed for each row returned.
         * @param {Function} [errback] executed if an error occurs.
         * @param {Object} [scope] scope to execute the callback and errback in.
         *
         * @return {comb.Promise} called back with results or the error if one occurs.
         */
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

        /**
         * Retrieve one row result from the query.
         *
         * @example
         *
         * dataset.one(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * //OR
         *
         * dataset.one().then(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * @param {Function} [callback] executed with the row
         * @param {Function} [errback] executed if an error occurs.
         *
         * @return {comb.Promise} called back with result or the error if one occurs.
         */
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

        /**
         * Retrieve the first result from an ordered query.
         *
         * @example
         * dataset.first(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * //OR
         *
         * dataset.first().then(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * @param {Function} [callback] executed with the row
         * @param {Function} [errback] executed if an error occurs.
         *
         * @return {comb.Promise} called back with result or the error if one occurs.
         */
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

        /**
         * Retrieve the last result from an ordered query. If the query is not ordered then the result is ambiguous.
         *
         * @example
         *
         * dataset.last(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * //OR
         *
         * dataset.last().then(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * @param {Function} [callback] executed with the row
         * @param {Function} [errback] executed if an error occurs.
         *
         * @return {comb.Promise} called back with result or the error if one occurs.
         */
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

        /**
         * Retrieve all rows from the query.
         *
         * @example
         *
         * dataset.all(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * //OR
         *
         * dataset.all().then(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * @param {Function} [callback] executed with the results.
         * @param {Function} [errback] executed if an error occurs.
         *
         * @return {comb.Promise} called back with results or the error if one occurs.
         */
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

        /**
         * Retrieve the last inserted id from the database.
         *
         * @example
         *
         * dataset.getLastInsertId(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * //OR
         *
         * dataset.getLastInsertId().then(function(r){
         *     Do something....
         * }, function(err){
         *     Do something...
         * });
         *
         * @param {Function} [callback] executed with the id
         * @param {Function} [errback] executed if an error occurs.
         *
         * @return {comb.Promise} called back with id or the error if one occurs.
         */
        getLastInsertId : function(callback, errback) {
            var retPromise = new Promise();
            adapter.getLastInsertId(this.db).addCallback(hitch(this, function(results) {
                if (results) {
                    retPromise.callback(results[0].id);
                } else {
                    retPromise.callback(null);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.then(callback, errback);
            return retPromise;
        },

        /**
         * Save values to a table.
         *
         * </br>
         * <b>This should not be used directly</b>
         *
         * @param {Function} [callback] executed with the row
         * @param {Function} [errback] executed if an error occurs.
         *
         * @return {comb.Promise} called back with results or the error if one occurs.
         */
        save : function(vals, loadId, callback, errback) {
            var retPromise = new Promise();
            adapter.save(this.table, vals, this.db).addCallback(hitch(this, function(results) {
                if (loadId) {
                    retPromise.callback(results.insertId);
                } else {
                    retPromise.callback(results);
                }
            })).addErrback(hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        /**
         * Alias for {@link Dataset#all}
         */
        run : function(callback, errback) {
            return this.all(callback, errback);
        }
    }
});


//returns a dataset for a particular type
exports.getDataSet = function(table, db, type, model) {
	if(!moose){
		moose = require("./index"), adapter = moose.adapter;
	}
    var dataset = comb.define([adapter, Dataset], {});
    return new dataset(table, db, type, model);
};