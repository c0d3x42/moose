var comb = require("comb"),
        hitch = comb.hitch,
        Promise = comb.Promise,
        PromiseList = comb.PromiseList,
        OneToMany = require("./oneToMany");

var LOGGER = comb.logging.Logger.getLogger("comb.associations.ManyToMany");
/**
 * @class Class to define a manyToMany association.
 *
 * </br>
 * <b>NOT to be instantiated directly</b>
 * Its just documented for reference.
 *
 * @name ManyToMany
 * @augments OneToMany
 *
 * @param {String} options.joinTable the joinTable of the association.
 *
 *
 * @property {String} joinTable the join table used in the relation.
 * */
module.exports = exports = comb.define(OneToMany, {
    instance : {

        _fetchMethod : "all",

        //constructor
        constructor : function(options) {
            if (!options.joinTable) {
                throw new Error("Join table required for a manyToManyRelationship");
            }
            this._joinTable = options.joinTable;
            this.super(arguments);
        },


        _filter : function(parent) {
            if (!this.filter) {
                if (!this.orderBy) {
                    this.orderBy = this.model.primaryKey;
                }
                var q = {};
                var jq = {};
                jq[this.leftKey] = parent[parent.primaryKey];
                q[this.model.table.pk] = {"in" : this.joinTable.dataset.select(this.rightKey).find(jq).sql};
                return this.model.filter(q).order(this.orderBy);
            } else {
                return this.super(arguments);
            }
        },

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
                        var p = new Promise();
                        v.save().then(hitch(this, function(child) {
                            var q = {};
                            q[self.leftKey] = this[this.primaryKey];
                            q[self.rightKey] = v[v.primaryKey];
                            self.joinTable.save(q).then(hitch(p, 'callback'), hitch(p, "errback"));
                        }), hitch(p, "errback"));
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
                    new PromiseList(pl).then(hitch(this, function(r) {
                        this[self.addedKey].length = 0;
                        this[self.removedKey].length = 0;
                        this[self.loadedKey] = true;
                        next();
                    }), function(err) {
                        err.forEach(function(e) {
                            LOGGER.error(util.inspect(err[0][1][1]));
                        });
                        next();
                    });
                } else {
                    this[self.loadedKey] = true;
                    next();
                }
            } else {
                next();
            }
        },

        _preRemove : function(next, self) {
            if (this.filter) next();
            if (!this[self.loadedKey]) {
                this[self.name].then(hitch(this, function(values) {
                    this[self.removedKey] = values;
                    self.diff.call(this, next, self);
                }));
            } else {
                this[self.removedKey] = this[self.name];
                self.diff.call(this, next, self);
            }

        },

        getters : {

            //returns our join table model
            joinTable : function() {
                return this.moose.getModel(this._joinTable);
            }
        }
    }
});

