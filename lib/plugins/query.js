var comb = require("comb"),
        hitch = comb.hitch,
        dataset = require("../dataset"),
        Promise = comb.Promise,
        PromiseList = comb.PromiseList;


//make a map of connections per model;
var connections = {};

/**
 * @private
 *
 * Create a dataset to query for a particular model
 *
 * @param {Model} model the model the dataset should wrap.
 * @param {Boolean} [hydrate=true] if set to true then the dataset will create Model instances for te results of the query, otherwise the raw results are returned.
 *
 * @return {Dataset} the dataset.
 */
var getDataset = function(model, hydrate) {
    if (typeof hydrate == "undefined") {
        hydrate = true;
    }
    var  table = model.table, tableName = table.tableName, connection = model.moose.getConnection(false, table.database);
    /*if((connection = connections[tableName]) == null){
     console.log("GET CONNECTION");
     connection  = (connections[tableName] = model.moose.getConnection(false));
     }*/
    if (hydrate) {
        return dataset.getDataSet(table.tableName, connection, table.type, model);
    } else {
        return dataset.getDataSet(table.tableName, connection, table.type);
    }
};

/**
 *
 * @private
 * Helper function to help Models expose Dataset functions as native methods.
 *
 * @param {String} op the operation that is being proxied
 * @param {Boolean} [hydrate=true] whether or not the results need to be hydrated to full model instances.
 *
 * @returns {Function} A function that will perform the proxied operation.
 */
var proxyDataset = function(op, hydrate) {
    return function(options, callback, errback) {
        if (typeof options == "function") {
            callback = options;
            errback = callback;
            options = null;
        }
        var dataset = getDataset(this, hydrate);
        if (typeof options == "object") {
            dataset.find(options);
        } else {
            callback = options;
            errback = callback;
        }
        return dataset[op](callback, errback);
    };
};


/**
 *@class Adds query support to a model. The QueryPlugin exposes methods to save, update, create, and delete.
 * The plugin also exposes static functions to query Models. The functions exposed on class are.
 * <ul>
 *     <li>filter</li>
 *     <li>findById</li>
 *     <li>count</li>
 *     <li>join</li>
 *     <li>where</li>
 *     <li>select</li>
 *     <li>all</li>
 *     <li>forEach</li>
 *     <li>first</li>
 *     <li>one</li>
 *     <li>last</li>
 * </ul>
 *
 * All queries require an action to be called on them before the results are fetched. The action methods are :
 *
 * <ul>
 *     <li>all</li>
 *     <li>forEach</li>
 *     <li>first</li>
 *     <li>one</li>
 *     <li>last</li>
 *
 * </ul>
 *
 * The action items accept a callback that will be called with the results. They also return a promise that will be
 * called with the results.
 *
 * <p>Assume we have an Employee model.</p>
 *
 * <p>
 *      <b>first</b></br>
 *      Get the record in a dataset, this query does not require an action method
 *      <pre class="code">
 *          Employee.first() => select * from employee limit 1
 *      </pre>
 * </p>
 *
 * <p>
 *      <b>filter</b></br>
 *      Sets the where clause on a query. See {@link Dataset}
 *      <pre class="code">
 *          //Equality Checks
 *          Employee.filter({eid : 1})
 *                  => select * from employee where eid = 1
 *          Employee.filter({eid : {gt : 1}})
 *                  => select * from employee where eid > 1
 *          Employee.filter({eid : {gte : 1}})
 *                  => select * from employee where eid >= 1
 *          Employee.filter({eid : {lt : 1}})
 *                  => select * from employee where eid < 1
 *          Employee.filter({eid : {lte : 1}})
 *                  => select * from employee where eid <= 1
 *          //Nested query in filter
 *          Employee.filter({eid : {gt : 1}, lastname : "bob"})
 *                  => select * from employee where eid > 1 and lastname = 'bob';
 *          Employee.filter({eid : [1,2,3], lastname : "bob"})
 *                  => select * from employee where eid in (1,2,3) and lastname = 'bob'
 *      </pre>
 * </p>
 * <p>
 *      <b>findById</b></br>
 *      Find a record in a dataset by id, this query does not require an action method
 *      <pre class="code">
 *          Employee.findById(1) => select * from employee where eid = 1
 *      </pre>
 * </p>
 * <p>
 *      <b>count</b></br>
 *      Find the number of records in a dataset, this query does not require an action method
 *      <pre class="code">
 *          Employee.count() => select count(*) as count from employee
 *          Employee.filter({eid : {gte : 1}}).count()
 *                  => select count(*) as count from employee  where eid > 1
 *      </pre>
 * </p>
 * <p>
 *      <b>join</b></br>
 *      Get Join two models together, this will not create model instances for the result.
 *      <pre class="code">
 *          Employee.join("words", {eid : "eid"}).where({"employee.eid" : 1})
 *                  => select * from employee inner join works on employee.id=works.id where employee.eid = 1
 *      </pre>
 * </p>
 *
 * <p>
 *      <b>Where</b></br>
 *      Sets the where clause on a query. See {@link Dataset}
 *      <pre class="code">
 *          //Equality Checks
 *          Employee.where({eid : 1})
 *                  => select * from employee where eid = 1
 *          Employee.where({eid : {gt : 1}})
 *                  => select * from employee where eid > 1
 *          Employee.where({eid : {gte : 1}})
 *                  => select * from employee where eid >= 1
 *          Employee.where({eid : {lt : 1}})
 *                  => select * from employee where eid < 1
 *          Employee.where({eid : {lte : 1}})
 *                  => select * from employee where eid <= 1
 *          //Nested query in filter
 *          Employee.where({eid : {gt : 1}, lastname : "bob"})
 *                  => select * from employee where eid > 1 and lastname = 'bob';
 *          Employee.where({eid : [1,2,3], lastname : "bob"})
 *                  => select * from employee where eid in (1,2,3) and lastname = 'bob'
 *      </pre>
 * </p>
 *
 * <p>
 *      <b>select</b></br>
 *      Selects only certain columns to return, this will not create model instances for the result.
 *      <pre class="code">
 *          Employee.select(eid).where({firstname : { gt : "bob"}})
 *                  => select eid from employee where firstname > "bob"
 *      </pre>
 * </p>
 *
 *
 * <p>
 *      <b>all, foreach, first, one, last</b></br>
 *      These methods all act as action methods and fetch the results immediately. Each method accepts a query, callback, and errback.
 *      The methods return a promise that can be used to listen for results also.
 *      <pre class="code">
 *          Employee.all()
 *                  => select * from employee
 *          Employee.forEach(function(){})
 *                  => select * from employee
 *          Employee.forEach({eid : [1,2,3]}, function(){}))
 *                  => select * from employee where eid in (1,2,3)
 *          Employee.one()
 *                  => select * from employee limit 1
 *      </pre>
 * </p>
 *
 * @name QueryPlugin
 * @memberOf moose.plugins
 *
 * @borrows Dataset#all as all
 * @borrows Dataset#forEach as forEach
 * @borrows Dataset#first as first
 * @borrows Dataset#one as one
 * @borrows Dataset#last as last
 * @borrows SQL#join as join
 * @borrows SQL#where as where
 * @borrows SQL#select as select
 *
 */
exports.QueryPlugin = comb.define(null, {
    instance : {
    /**@lends moose.plugins.QueryPlugin.prototype*/

        /**
         * Force the reload of the data for a particular model instance.
         *
         * @example
         *
         * myModel.reload().then(function(myModel){
         *    //work with this instance
         * });
         *
         * @return {comb.Promise} called back with the reloaded model instance.
         */
        reload : function() {
            var pk = this.primaryKey;
            var q = {};
            if (pk) {
                if (pk instanceof Array) {
                    for (var i = pk.length - 1; i > 0; i--) {
                        var p = pk[i];
                        q[p] = this[p];
                    }
                } else {
                    q[pk] = this[pk];
                }

            } else {
                q = this.toSql();
            }

            var retPromise = new Promise();
            getDataset(this.constructor).find(q).one().then(hitch(retPromise, "callback"), hitch(retPromise, "errback"));
            return retPromise;
        },

        /**
         * Remove this model.
         *
         * @param {Function} errback called in the deletion fails.
         *
         * @return {comb.Promise} called back after the deletion is successful
         */
        remove : function(errback) {
            var pk = this.primaryKey;
            if (pk) {
                var q = {};
                if (pk instanceof Array) {
                    for (var i = pk.length - 1; i > 0; i--) {
                        var p = pk[i];
                        q[p] = this[p];
                    }
                } else {
                    q[pk] = this[pk];
                }

            } else {
                q = this.toSql();
            }
            var retPromise = new Promise();
            this._hook("pre", "remove").then(hitch(this, function() {
                var dataset = getDataset(this);
                dataset.remove(null, q).exec().then(hitch(this, function(results) {
                    this.__isNew = true;
                    var columns = this.table.columns, ret = {};
                    for (var i in columns) {
                        this["_" + i] = null;
                    }
                    this._hook("post", "remove").then(hitch(retPromise, "callback"));
                }), hitch(retPromise, "errback"));
            }), hitch(retPromise, "errback"));
            retPromise.addErrback(errback);
            return retPromise;
        },

        /**
         * Update a model with new values.
         *
         * @example
         *
         * someModel.update({
         *      myVal1 : "newValue1",
         *      myVal2 : "newValue2",
         *      myVal3 : "newValue3"
         *      }).then(..do something);
         *
         * //or
         *
         * someModel.myVal1 = "newValue1";
         * someModel.myVal2 = "newValue2";
         * someModel.myVal3 = "newValue3";
         *
         * someModel.update().then(..so something);
         *
         * @param {Object} [options] values to update this model with
         * @param {Function} [errback] function to call if the update fails, the promise will errback also if it fails.
         *
         * @return {comb.Promise} called on completion or error of update.
         */
        update : function(options, errback) {
            if (!this.__isNew && this.__isChanged) {
                for (var i in options) {
                    if (this.table.validate(i, options[i])) {
                        this[i] = options;
                    }
                }
                var pk = this.primaryKey;
                if (pk) {
                    var q = {};
                    if (pk instanceof Array) {
                        for (var i = pk.length - 1; i > 0; i--) {
                            var p = pk[i];
                            q[p] = this[p];
                        }
                    } else {
                        q[pk] = this[pk];
                    }

                } else {
                    q = this.toSql();
                }
                var retPromise = new Promise();
                this._hook("pre", "update").then(hitch(this, function() {
                    var dataset = getDataset(this);
                    dataset.update(this.toSql(), q).exec().then(hitch(this, function() {
                        this.__isChanged = false;
                        this._hook("post", "update").then(hitch(this, function() {
                            retPromise.callback(this);
                        }));
                    })),hitch(retPromise, "errback");
                }));
                retPromise.addErrback(errback);
                return retPromise;
            } else if (this.__isNew && this.__isChanged) {
                return this.save(options, errback);
            } else {
                throw new Error("Cannot call update on an unchanged object");
            }
        },

        /**
         * Save a model with new values.
         *
         * @example
         *
         * someModel.save({
         *      myVal1 : "newValue1",
         *      myVal2 : "newValue2",
         *      myVal3 : "newValue3"
         *      }).then(..do something);
         *
         * //or
         *
         * someModel.myVal1 = "newValue1";
         * someModel.myVal2 = "newValue2";
         * someModel.myVal3 = "newValue3";
         *
         * someModel.save().then(..so something);
         *
         * @param {Object} [options] values to save this model with
         * @param {Function} [errback] function to call if the save fails, the promise will errback also if it fails.
         *
         * @return {comb.Promise} called on completion or error of save.
         */
        save : function(options, errback) {
            if (this.__isNew) {
                var pk = this.primaryKey, thisPk = null;
                if (pk instanceof Array) {
                    pk = null;
                }
                if (options) {
                    for (var i in options) {
                        this[i] = options;
                    }
                }
                thisPk = this.primaryKeyValue;
                var retPromise = new Promise();
                this._hook("pre", "save").then(hitch(this, function() {
                    getDataset(this).save(this.toSql(), !thisPk).then(hitch(this, function(res) {
                        this.__isNew = false;
                        this.__isChanged = false;
                        if (pk && !thisPk) {
                            this[pk] = this.table.columns[pk].fromSql(res);
                        }
                        this._hook("post", "save").then(hitch(this, function() {
                            retPromise.callback(this);
                        }));
                    }), hitch(retPromise, "errback"));
                }));
                retPromise.addErrback(errback);
                return retPromise;
            } else {
                return this.update(options, errback);
            }
        },

        /**
         * Serializes all values in this model to the sql equivalent.
         */
        toSql : function() {
            var columns = this.table.columns, ret = {};
            for (var i in columns) {
                ret[i] = columns[i].toSql(this[i]);
            }
            return ret;
        }

    },

    static : {

    /**@lends moose.plugins.QueryPlugin*/

        /**
         * Filter a model to return a subset of results. {@link SQL#find}
         *
         * <p><b>This function requires all, forEach, one, last,
         *       or count to be called inorder for the results to be fetched</b></p>
         * @param {Object} [options] query to filter the dataset by.
         * @param {Boolean} [hydrate=true] if true model instances will be the result of the query,
         *                                  otherwise just the results will be returned.
         *
         *@return {Dataset} A dataset to query, and or fetch results.
         */
        filter : function(options, hydrate) {
            return getDataset(this, hydrate).find(options);
        },

        /**
         * Retrieves a record by the primarykey of a table.
         * @param {*} id the primary key record to find.
         *
         * @return {comb.Promise} called back with the record or null if one is not found.
         */
        findById : function(id) {
            var pk = this.table.pk;
            var q = {};
            q[pk] = id;
            return this.filter(q).one();
        },

        /**
         * Update multiple rows with a set of values.
         *
         * @param {Object} vals the values to set on each row.
         * @param {Object} [options] query to limit the rows that are updated
         * @param {Function} [callback] function to call after the update is complete.
         * @param {Function} [errback] function to call if the update errors.
         *
         * @return {comb.Promise|Dataset} if just values were passed in then a dataset is returned and exec has to be
         *                                  called in order to complete the update.
         *                                If options, callback, or errback are provided then the update is executed
         *                                and a promise is returned that will be called back when the update completes.
         */
        update : function(vals, /*?object*/options, /*?callback*/callback, /*?function*/errback) {
            var args = Array.prototype.slice.call(arguments);
            var dataset = getDataset(this);
            if (args.length > 1) {
                vals = args[0];
                options = args[1];
                if (typeof options == "function") {//then execute right away we have a callback
                    callback = options;
                    if (args.length == 3) errback = args[2];
                    var retPromise = new Promise();
                    dataset.update(vals).exec().then(function() {
                        retPromise.callback(true);
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

        /**
         * Remove rows from the Model.
         *
         * @param {Object} [q] query to filter the rows to remove
         * @param {Function} [errback] function to call if the removal fails.
         *
         * @return {comb.Promise} called back when the removal completes.
         */
        remove : function(q, errback) {
            var retPromise = new Promise();
            //first find all records so we call alert all associations and all other crap that needs to be
            //done in middle ware
            var p = new Promise();
            var pls = [];
            getDataset(this).find(q).all(function(items) {
                //todo this sucks find a better way!
                var pl = items.map(function(r) {
                    return r.remove();
                });
                new PromiseList(pl).then(hitch(p, "callback"), hitch(p, "errback"));
            }, hitch(p, "errback"));
            p.addErrback(errback);
            return p;
        },

        /**
         * Save either a new model or list of models to the database.
         *
         * @example
         *
         * //Save a group of records
         * MyModel.save([m1,m2, m3]);
         *
         * Save a single record
         * MyModel.save(m1);
         *
         * @param {Array|Object} record the record/s to save to the database
         * @param {Function} [errback] function to execute if the save fails
         *
         * @return {comb.Promise} called back with the saved record/s.
         */
        save : function(options, errback) {
            var ps;
            if (options instanceof Array) {
                ps = options.map(function(o) {
                    return this.save(o);
                }, this);
                var pl = new PromiseList(ps);
                pl.addErrback(errback);
                return pl;
            } else {
                var promise = new Promise();
                this.load(options).then(function(m) {
                    m.save().then(hitch(promise, "callback"), hitch(promise, "errback"));
                }, hitch(promise, "errback"));
                promise.addErrback(errback);
                return promise;
            }
        },

        /**
         * Retrieve the number of records in the database.
         *
         * @param {Function} [callback] function to execute with the result
         * @param {Function} [errback] funciton to execute if the operation fails
         *
         * @return {comb.Promise} called back with the result, or errors if the operation fails.
         */
        count : function(callback, errback) {
            var ret = new Promise();
            getDataset(this).count().one(function(count) {
                ret.callback(count.count);
            }, hitch(ret, "errback"));
            ret.then(callback, errback);
            return ret;
        },

        join : function() {
            var d = getDataset(this, false);
            return d.join.apply(d, arguments);
        },

        where : function() {
            var d = getDataset(this);
            return d.where.apply(d, arguments);
        },

        select : function() {
            var d = getDataset(this);
            return d.select.apply(d, arguments);
        },

        all : proxyDataset("all", true),


        forEach : proxyDataset("forEach", true),


        first : proxyDataset("first", true),

        one : proxyDataset("one", true),

        last : proxyDataset("last", true),


        /**@ignore*/
        getters : {

            dataset : function() {
                return getDataset(this, false);
            }
        }
    }
});

