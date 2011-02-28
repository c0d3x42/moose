var util = require("util"),
        adapters = require("./adapters");


//returns a dataset for a particular type
exports.getDataSet = function(table, db, type, model) {
    var Dataset = (Dataset = function(table, db, type, model) {
        if (!table) throw new Error("table is required by dataset");
        if (!db) throw new Error("db is required by dataset");
        //if(!model) throw new Error("model is required by dataset");
        this.table = table;
        this.db = db;
        //this.model = model;
        type.call(this, table, db);
    });

    util.inherits(Dataset, adapters[type]);

    Dataset.prototype._load = function(results) {
        return results;
    };

    Dataset.prototype.forEach = function(callback, errback) {
        if (callback) {
            var self = this;
            return this.exec(function(err, results, fields) {
                if (err && errback) {
                    errback(err);
                } else if (results && results.length) {
                    results = self._load(results);
                    results.forEach(callback);
                } else {
                    callback(null);
                }

            });
        } else {
            throw new Error("callback required");
        }
    };

    Dataset.prototype.one = function(callback, errback) {
        if (callback) {
            this.limit(1);
            var self = this;
            return this.exec(function(err, results, fields) {
                if (err && errback) {
                    errback(err);
                } else if (results && results.length) {
                    results = self._load(results);
                    callback(results[0]);
                } else {
                    callback(null);
                }

            });
        } else {
            throw new Error("callback required");
        }
    };

    Dataset.prototype.first = function(callback, errback) {
        if (callback) {
            var self = this;
            return this.exec(function(err, results, fields) {
                if (err && errback) {
                    errback(err);
                } else if (results && results.length) {
                    results = self._load(results);
                    callback(results[0]);
                } else {
                    callback(null);
                }

            });
        } else {
            throw new Error("callback required");
        }
    };

    Dataset.prototype.last = function(callback, errback) {
        if (callback) {
            var self = this;
            return this.exec(function(err, results, fields) {
                if (err && errback) {
                    errback(err);
                } else if (results && results.length) {
                    results = self._load(results);
                    callback(results[results.length - 1]);
                } else {
                    callback(null);
                }
            });
        } else {
            throw new Error("callback required");
        }
    };

    Dataset.prototype.all = function(callback, errback) {
        if (callback) {
            var self = this;
            return this.exec(function(err, results, fields) {
                if (err && errback) {
                    errback(err);
                } else if (results) {
                    results = self._load(results);
                    callback(results);
                } else {
                    callback(null);
                }
            });
        } else {
            throw new Error("callback required");
        }
    };

    Dataset.prototype.run = function(callback, errback) {
        this.all(callback, errback);
    };

    return new Dataset(table, db, adapters[type], model);
};