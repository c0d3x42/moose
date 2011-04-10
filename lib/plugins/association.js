var associations = require("../associations"),
        oneToMany = associations.oneToMany,
        manyToOne = associations.manyToOne,
        oneToOne = associations.oneToOne,
        manyToMany = associations.manyToMany,
        fetch = associations.fetch,
comb = require("comb");

exports.AssociationPlugin = comb.define(null, {
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