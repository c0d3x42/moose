var comb = require("comb"),
        define = comb.define,
        hitch = comb.hitch;

var Cache = define(null, {

    instance : {

        __checkInterval : 1000,

        constructor : function() {
            this.__map = {};
            setInterval(hitch(this, this._checkValues), this.__checkInterval);
        },

        _checkValues : function() {
            var map = this.__map, now = new Date();
            for (var i in map) {
                var expires = map[i].expires;
                if (this._doesExpire(now, expires)) {
                    console.log("REMOVING " + i);
                    delete map[i];
                }

            }
        },

        _covertSeconds : function(seconds) {
            return seconds * 60000;
        },

        _doesExpire : function(date, stamp) {
            if (stamp == 0) return false;
            return date.getTime() > stamp;
        },

        //gets a value
        get : function(key) {
            if (this.__map[key]) {
                return this.__map[key].value;
            } else {
                return null;
            }
        },

        //Set a key unconditionally
        set : function(key, value, expires) {
            expires = !expires || expires == 0 ? 0 : new Date().getTime() + this._covertSeconds(expires);
            this.__map[key] = {value : value, expires : expires, updated : new Date()};
        },
        //Add a new key
        add : function(key) {
            this.__map = null;
        },
        //replace a value
        replace : function(key, value) {
            delete this.__map[key];
            this.set(key, value);
        },
        //appends a to an existing record
        //if current value is an object we create an array
        append : function(key, value) {
            var currValue = this.__map[key].value;
            if (typeof key == "string") {
                currValue += value;
            } else {
                currValue = [currValue, value];
            }
            this.__map[key].value = currValue;
        },
        //prepend to a record
        prepend : function() {
            var currValue = this.__map[key].value;
            if (typeof key == "string") {
                currValue += value;
            } else {
                currValue = [currValue, value];
            }
            this.__map[key].value = currValue;
        },
        //increments a numeric value
        incr : function(key) {
            var value = this.__map[key];
            if (typeof value == "number") {
                this.__map[key]++;
            }
        },
        //decrements a numeric value
        decr : function() {
            var value = this.__map[key];
            if (typeof value == "number") {
                this.__map[key]--;
            }
        },
        //remove a value
        remove : function(key) {
            delete this.__map[key];
        },
        //removes all key value pairs
        flush_all : function() {
            this.__map = {};
        }
    }

});

module.exports = exports = new Cache();