var utility = require("../util"),
        hitch = utility.hitch,
        promise = require("../promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        ManyToOne = require("./manyToOne");

//class to define a oneToOne association
//If your models are mutually dependant and ne model should be oneToOne, the other should be manyToOne
module.exports = exports = utility.define(ManyToOne, {
    instance : {

        //override
        //@see _Association
        _fetchMethod : "one",

        //override
        //@see _Association
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

        //override
        //@see _Association
        _postSave : function(next, self) {
            if (self.filter && self.isEager()) {
                this[self.name].then(hitch(this, next));
            } else {
                var loadedKey = self.loadedKey, name = self.name;
                if (this[loadedKey] && this["_" + name]) {
                    var val = this["_" + name];
                    val[self.rightKey] = this[self.leftKey];
                    val.save().then(hitch(this, next));
                } else {
                    next();
                }
            }
        },

        //override
        //@see _Association
        _preRemove : function(next, self) {
            if (self.filter) next();
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