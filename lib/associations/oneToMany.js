var comb = require("comb"),
        hitch = comb.hitch,
        Promise = comb.Promise,
        PromiseList = comb.PromiseList,
        _Association = require("./_Association");

/**
 * @class Class to define a one to many association.
 *
 * </br>
 * <b>NOT to be instantiated directly</b>
 * Its just documented for reference.
 *
 * @name OneToMany
 * @augments _Association
 *
 * */
module.exports = exports = comb.define(_Association, {
    instance : {
         /**@lends OneToMany.prototype*/
        /**
         * Compares our associtaion and handle any creation, removal, reloading of the associated model.
         * @param {Function} next funciton to call to pass control up the middleware chain.
         * @param {Object} reference to the acting association class.
         */

        diff : function(next, self) {
            if (!this[self.loadedKey]) {
                if (!self.filter || (self.filter && self.isEager())) {
                    this[self.name].then(hitch(this, self.diff, next, self));
                } else {
                    next();
                }
            } else if (!this.filter) {
                var values = this[self.addedKey];
                var removeValues = this[self.removedKey];
                var pl = [];
                if (values.length) {
                    pl = pl.concat(values.map(function(v) {
                        v[self.rightKey] = this[self.leftKey];
                        return v.save();
                    }, this));
                }
                if (removeValues.length) {
                    pl = pl.concat(removeValues.map(function(v) {
                        return v.remove();
                    }, this));
                }
                if (pl.length) {
                    new PromiseList(pl).addCallback(hitch(this, function() {
                        this[self.addedKey].length = 0;
                        this[self.removedKey].length = 0;
                        this[self.loadedKey] = true;
                        next();
                    }));
                } else {
                    this[self.loadedKey] = true;
                    next();
                }
            } else {
                next();
            }
        },

        _preRemove : function(next, self) {
            if (self.filter) next();
            if (!this[self.loadedKey] && !self.isEager()) {
                this[self.name].then(hitch(this, function() {
                    var values = this[self.name];
                    values.forEach(function(v) {
                        v.remove();
                    });
                    next();
                }));
            } else {
                var values = this[self.name];
                values.forEach(function(v) {
                    v.remove();
                });
                next();
            }

        },

        _postSave : function(next, self) {
            self.diff.call(this, next, self);
        },

        _postUpdate : function(next, self) {
            self.diff.call(this, next, self);
        },

        _postLoad : function(next, self) {
            if (self.isEager()) {
                self.fetch(this).then(hitch(this, function(results) {
                    this[self.loadedKey] = true;
                    results = results.map(function(result) {
                        var m = result;
                        m.__isNew = false;
                        return m;
                    });
                    this["_" + self.name] = results;
                    next();
                }));
            } else {
                next();
            }
        },

        _getter : function(self) {
            //if we have them return them;
            if (this[self.loadedKey]) return this["_" + self.name];

            //Else we dont have
            if (this.isNew) throw new Error("Model is a new object and no associations have been fetched");
            var retPromise = new Promise();
            self.fetch(this).then(hitch(this, function(results) {
                this[self.loadedKey] = true;
                results = results.map(function(result) {
                    var m = result;
                    m.__isNew = false;
                    return m;
                });
                this["_" + self.name] = results;
                retPromise.callback(results);
            }), hitch(retPromise, "errback"));
            return retPromise;
        },

        _setter : function(vals, self) {
            if (this.isNew) {
                vals.forEach(function(v, i) {
                    if (!(v instanceof self.model)) {
                        vals[i] = new self.model(v);
                    }
                }, this);
                this["_" + self.name] = vals;
                this[self.addedKey] = this[self.addedKey].concat(vals);
                this[self.loadedKey] = true;
            } else {
                //set the pk on each value
                vals.forEach(function(v, i) {
                    v[self.rightKey] = this[self.leftKey];
                    if (!(v instanceof self.model)) {
                        vals[i] = new self.model(v);
                    }
                }, this);
                this[self.removedKey] = this[self.removedKey].concat(this["_" + self.name]);
                this[self.addedKey] = this[self.addedKey].concat(vals);
                this.__isChanged = true;
                this["_" + self.name] = vals;
            }

        },

        /**
         *SEE {@link _Association#inject}.
         * </br>
         *Adds the following methods to each model.
         * <ul>
         *  <li>add<ModelName> - add an association</li>
         *  <li>add<ModelsName>s - add multiple associations</li>
         *  <li>remove<ModelName> - remove an association</li>
         *  <li>splice<ModelName>s - splice a number of associations</li>
         *  </ul>
         **/
        inject : function(parent, name) {
            this.super(arguments);
            this.removedKey = "__removed" + name + "";
            this.addedKey = "__added_" + name + "";
            parent.prototype[this.removedKey] = [];
            parent.prototype[this.addedKey] = [];
            if (!this.filter) {
                var self = this;
                var singular = name, m;
                if ((m = name.match(/(\w+)s$/)) != null) {
                    singular = m[1];
                }
                var addName = "add" + singular.charAt(0).toUpperCase() + singular.slice(1);
                var addNames = "add" + name.charAt(0).toUpperCase() + name.slice(1);
                var removeName = "remove" + singular.charAt(0).toUpperCase() + singular.slice(1);
                var spliceName = "splice" + name.charAt(0).toUpperCase() + name.slice(1);
                parent.prototype[addName] = function(item) {
                    if (!this.isNew) {
                        item[self.rightKey] = this[self.leftKey];
                        if (!(item instanceof self.model)) {
                            item = new self.model(item);
                        }
                        if (!this[self.loadedKey]) {
                            var ret = new Promise();
                            this[name].then(hitch(this, function() {
                                this["_" + name].push(item);
                                this[self.addedKey].push(item);
                                this.__isChanged = true;
                                ret.callback();
                            }), hitch(ret, "errback"));
                            return ret;
                        }
                    } else {
                        if (!(item instanceof self.model)) {
                            item = new self.model(item);
                        }
                    }
                    this[self.addedKey].push(item);
                    this.__isChanged = true;
                    return this;
                };

                parent.prototype[addNames] = function(items) {
                    if (!this.isNew && !this[self.loadedKey]) {

                        var ret = new Promise();
                        this[name].then(hitch(this, function() {
                            items.forEach(hitch(this, addName));
                            ret.callback();
                        }));
                        return ret;
                    }
                    items.forEach(hitch(this, addName));
                    return this;
                };

                parent.prototype[removeName] = function(index) {
                    return this[spliceName](index, index + 1);
                };

                //if remove is specified then the item is deleted from db,
                parent.prototype[spliceName] = function(start, end) {
                    var items = this[name];
                    if (!this[self.loadedKey]) {
                        var ret = new Promise();
                        items.then(hitch(this, function() {
                            var items = this["_" + name].splice(start, end - start);
                            if (items && items.length) {
                                this[self.removedKey] = this[self.removedKey].concat(items);
                            }
                            this.__isChanged = true;
                            ret.callback();
                        }), hitch(ret, "errback"));
                        return ret;
                    } else {
                        items = items.splice(start, end - start);
                        if (items && items.length) {
                            this[self.removedKey] = this[self.removedKey].concat(items);
                        }
                    }
                    this.__isChanged = true;
                    return this;
                };
            }
        }
    }
});