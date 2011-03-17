var utility = require("./util"),
        hitch = utility.hitch,
        util = require('util'),
        adapters = require("./adapters"),
        promise = require("./promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        moose = require("./index");


exports.fetch = ( fetch = {
    LAZY : "lazy",
    EAGER : "eager"
});

var association = utility.define(null, {
    instance : {
        _model : null,

        leftKey : null,

        rightKey : null,

        fetchType : fetch.LAZY,

        orderBy : null,

        _fetchMethod : "all",

        constructor : function(options, moose) {
            if (!options.model) throw new Error("Model is required for oneToMany association");
            this._model = options.model;
            this.moose = moose;
            this.orderBy = options.orderBy;
            for (var i in options.key) {
                this.leftKey = i;
                this.rightKey = options.key[i];
            }
            this.fetchType = options.fetchType || fetch.LAZY;
        },

        isEager : function() {
            return this.fetchType == fetch.EAGER;
        },

        fetch :  function(parent) {
            var q = {};
            q[this.rightKey] = parent[this.leftKey];
            if(!this.orderBy){
                this.orderBy = this.model.primaryKey;
            }
            return this.model.filter(q).order(this.orderBy)[this._fetchMethod]();
        },

        _preRemove : function(next, self) {
            next()
        },
        _postRemove : function(next, self) {
            next()
        },
        _preSave : function(next, self) {
            next()
        },
        _postSave : function(next, self) {
            next()
        },
        _preUpdate : function(next, self) {
            next()
        },
        _postUpdate : function(next, self) {
            next()
        },
        _preLoad : function(next, self) {
            next()
        },
        _postLoad : function(next, self) {
            next()
        },

        _setter : function(val, self) {
            this["_" + self.name] = val;
        },

        _getter : function(self) {
            return this["_" + self.name];
        },

        inject : function(parent, name) {
            this.loadedKey = "__" + name + "_loaded";
            this.name = name;
            var self = this;

            parent.prototype["_" + name] = [];
            parent.prototype[this.loadedKey] = false;

            parent.prototype.__defineGetter__(name, function() {
                return  self._getter.call(this, self);
            });
            parent.prototype.__defineSetter__(name, function(vals) {
                self._setter.call(this, vals, self);
            });

            //set up all callbacks
            ["pre", "post"].forEach(function(op) {
                ["save", "update", "remove", "load"].forEach(function(type) {
                    parent[op](type, function(next) {
                        return self["_" + op + type.charAt(0).toUpperCase() + type.slice(1)].call(this, next, self);
                    });
                }, this);
            }, this);
        }
    },

    getters : {
        model : function(){
            return this.moose.getModel(this._model);
        }
    }
});

exports.oneToMany = (oneToMany = utility.define(association, {
    instance : {

        diff : function(next, self) {
            if (!this[self.loadedKey] && self.isEager()) {
                this[self.name].then(hitch(self, "diff", next, self));
            } else {
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
                    new PromiseList(pl).addCallback(hitch(this, function(r) {
                        this[self.addedKey].length = 0;
                        this[self.removedKey].length = 0;
                        this[self.loadedKey] = true;
                        next();
                    }));
                } else {
                    this[self.loadedKey] = true;
                    next();
                }
            }
        },

        _preRemove : function(next, self) {
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

        inject : function(parent, name) {
            this.super(arguments);
            this.removedKey = "__removed" + name + "";
            this.addedKey = "__added_" + name + "";
            parent.prototype[this.removedKey] = [];
            parent.prototype[this.addedKey] = [];
            var self = this;
            var singular = name, m;
            if ((m = name.match(/(\w+)s$/)) != null) {
                singular = m[1]
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
}));

exports.manyToOne = (manyToOne = utility.define(association, {
    instance : {
        _fetchMethod : "one",

        _postLoad : function(next, self) {
            if (self.isEager()) {
                self.fetch(this).then(hitch(this, function(result) {
                    this[self.loadedKey] = true;
                    this["_" + self.name] = result;
                    next();
                }));
            } else {
                next();
            }
        },

        _getter : function(self) {
            //if we have them return them;
            var loadedKey = self.loadedKey, name = self.name;
            if (this[loadedKey]) return this["_" + name];
            //Else we dont have
            if (this.isNew) throw new Error("Model is a new object and no associations have been fetched");
            var retPromise = new Promise();
            self.fetch(this).then(hitch(this, function(result) {
                this[loadedKey] = true;
                var m = result;
                this["_" + name] = m;
                retPromise.callback(m);
            }), hitch(retPromise, "errback"));
            return retPromise;
        },

        _setter : function(cal, self) {
            var name = self.name;
            if (this.isNew) {
                if (!(val instanceof self.model)) {
                    val = new self.model(val);
                }
                this["_" + name] = val;
            } else {
                //set my foreign key
                if (!(val instanceof self.model)) {
                    val = new self.model(val);
                }
                this[self.leftKey] = val[self.rightKey];
                this["_" + name] = val;
            }
        }
    }
}));

exports.oneToOne = utility.define(manyToOne, {
    instance : {
        _fetchMethod : "one",

        _setter : function(val, self) {
            var loadedKey = self.loadedKey, name = self.name;
            if (!(val instanceof self.model)) {
                val = new self.model(val);
            }
            if (this.isNew) {
                this["_" + name] = val;
                this[loadedKey] = true;
            } else {
                //set my foreign key
                val[self.rightKey] = this[self.leftKey];
                this["_" + name] = val;
                this[loadedKey] = true;
            }
        },

        _postSave : function(next, self) {
            var loadedKey = self.loadedKey, name = self.name;
            if (this[loadedKey] && this["_" + name]) {
                var val = this["_" + name];
                val[self.rightKey] = this[self.leftKey];
                val.save().then(hitch(this, next));
            } else {
                next();
            }
        },

        _preRemove : function(next, self) {
            var loadedKey = self.loadedKey, name = self.name;
            if (!this[loadedKey]) {
                this[name].then(hitch(this, function(value) {
                    if (value) {
                        value.remove();
                    }
                    next();
                }));
            } else {
                var value = this[name];
                value.remove();
                next();
            }
        }
    }
});

exports.manyToMany = utility.define(oneToMany, {
    instance : {
        _fetchMethod : "all",

        constructor : function(options) {
            if (!options.joinTable){
                throw new Error("Join table required for a manyToManyRelationship");
            }
            this._joinTable = options.joinTable;
            this.super(arguments);
        },

        fetch : function(parent) {
            if(!this.orderBy){
                this.orderBy = this.model.primaryKey;
            }
            var q = {};
            var jq = {};
            jq[this.leftKey] = parent[parent.primaryKey];
            q[this.model.table.pk] = {"in" : this.joinTable.getDataset().select(this.rightKey).find(jq).sql};
            return this.model.filter(q).order(this.orderBy)[this._fetchMethod]();
        },

        diff : function(next, self) {
            if (!this[self.loadedKey]) {
                this[self.name].then(hitch(this, self.diff, next, self));
            } else {
                var values = this[self.addedKey];
                var removeValues = this[self.removedKey];
                var pl = [];
                if (values.length) {
                    pl = pl.concat(values.map(function(v) {
                        var p = new Promise();
                        v.save().then(hitch(this, function(child) {
                            var q = {};
                            q[self.leftKey] = this[this.primaryKey];
                            q[self.rightKey] = v[v.primaryKey];
                            self.joinTable.save(q).then(hitch(p, 'callback'), hitch(p, "errback"));
                        }));
                        return p;
                    }, this));
                }
                if (removeValues.length) {
                    var ids = removeValues.map(function(v) {
                        return v.primaryKeyValue;
                    });
                    var q = {};
                    q[self.rightKey] = {"in" : ids};
                    pl.push(self.joinTable.remove(q));
                }
                if (pl.length) {
                    new PromiseList(pl).addCallback(hitch(this, function(r) {
                        this[self.addedKey].length = 0;
                        this[self.removedKey].length = 0;
                        this[self.loadedKey] = true;
                        next();
                    }));
                } else {
                    this[self.loadedKey] = true;
                    next();
                }
            }
        },

        _preRemove : function(next, self) {
            if (!this[self.loadedKey]) {
                this[self.name].then(hitch(this, function(values) {
                    this[self.removedKey] = values;
                    self.diff.call(this, next, self);
                }));
            } else {
                this[self.removedKey] = this[self.name];
                self.diff.call(this, next, self);
            }
        }
    },

    getters : {
        joinTable : function(){
            return this.moose.getModel(this._joinTable);
        }
    }
});

