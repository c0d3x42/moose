var associations = require("../associations");
var oneToMany = associations.oneToMany;
var manyToOne = associations.manyToOne;
var oneToOne = associations.oneToOne;
var manyToMany = associations.manyToMany;
var fetch = associations.fetch;

exports.AssociationPlugin = utility.define(null, {
    static : {
        oneToMany : function(name, options) {
            var assoc = new oneToMany(options, this.moose);
            assoc.inject(this, name);
        },

        manyToOne : function(name, options) {
            var assoc = new manyToOne(options, this.moose);
            assoc.inject(this, name);
        },

        oneToOne : function(name, options){
            var assoc = new oneToOne(options, this.moose);
            assoc.inject(this, name);
        },

        manyToMany : function(name, options){
            var assoc = new manyToMany(options, this.moose);
            assoc.inject(this, name);
        },

        fetchType : fetch
    }});