var vows = require('vows'),
        assert = require('assert'),
        moose = require("../lib/utilities/define");

var suite = vows.describe("Define");

var Mammal = moose.define(null, {
    instance : {

        constructor: function(options) {
            this._type = options.type || "mammal"
        },

        speak : function() {
            return "A mammal of type " + this._type + " sounds like";
        }
    },

    getters : {
        type : function(type) {
            return this._type;
        }
    }
});

var Dog = moose.define(Mammal, {
    instance: {
        constructor: function(options) {
            this._sound = "woof";
            this._color = options.color || "black";

        },

        speak : function() {
            var s = this.super(arguments);
            return s + " a " + this._sound;
        }
    },

    getters : {
        color : function() {
            return this._color;
        },

        sound : function() {
            return this._sound;
        }
    }
});

var Lab = moose.define(null, {
      instance : {
          speak : function(){
                return "Im a lab " + that
          },
      }
});

var Breed = moose.define(Dog, {
    instance: {
        constructor: function(options) {
            this.breed = options.breed || "lab";
        },

        speak : function() {
            var s = this.super(arguments);
            return s + " thats really loud!";
        }
    }
});

suite.addBatch({
    "a dog " :{
        topic : new Dog({color : "gold"}),

        "should sound like a dog" : function(dog) {
            assert.equal(dog.speak(), "A mammal of type mammal sounds like a woof");
            assert.equal(dog.type, "mammal");
            assert.equal(dog.color, "gold");
            assert.equal(dog.sound, "woof");
        }
    }
});

suite.addBatch({
    "a Breed " :{
        topic : new Breed({color : "gold", type : "lab"}),

        "should sound like a lab" : function(dog) {
            assert.equal(dog.speak(), "A mammal of type lab sounds like a woof thats really loud!");
            assert.equal(dog.type, "lab");
            assert.equal(dog.color, "gold");
            assert.equal(dog.sound, "woof");
        }
    }
});

suite.run({reporter : require("vows/reporters/spec")});

