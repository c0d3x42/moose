var comb = require("comb"),
        hitch = comb.hitch,
        Promise = comb.Promise,
        PromiseList = comb.PromiseList,
        _Association = require("./_Association");
/**
 * @class Class to define a many to one association.
 *
 * </br>
 * <b>NOT to be instantiated directly</b>
 * Its just documented for reference.
 *
 * @name ManyToOne
 * @augments _Association
 *
 * */
module.exports = exports = comb.define(_Association, {
    instance : {
        _fetchMethod : "one",

        //override
        //@see _Association
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

        //override
        //@see _Association
        _getter : function(self) {
            //if we have them return them;
            var loadedKey = self.loadedKey, name = self.name;
            //todo make all lazy models always return a Promise
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

        //override
        //@see _Association
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
});