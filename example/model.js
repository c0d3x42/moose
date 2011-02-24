exports.model = new moose.Model("test", {
    properties : {
        foo : String,
        bar : Number,
        created : {type : Date, unique : true, allowNull : false},
        id : {type : Number, allowNull : false, autoIncrement : true, unique : true}
    },
    getters : {
        created : function(){
            return this.created.getDate();
        }
    },
    setters : {
        created : function(date){
            this.created = date.getUTCDate();
        },
        tableName : function(){}
    },
    instance : {
        //we support other methods too!
        otherMethod : function(){},

        intersect : function(){},
        "each" : function(){},
        refresh : function(){},
        "set" : function(){},
        update : function(){},
        validate : function(){}
    },
    callbacks : function(){
        //called before a new object is created
        beforeCreate : function(){},
        //called after a new object is created
        afterCreate : function(){},
        //called before an object is saved
        //note: only called on previously persisted objects
        beforeSave : function(){},
        //called after an object is saved
        //note: only called on previously persisted objects
        afterSave : function(){},
        //called before an object is deleted
        //note: only called on previously persisted objects
        beforeDelete : function(){},
        //called after an object is deleted
        //note: all propeties still exists, could be used to clear
        //from something like memcache
        afterDelete : function(){},
    },
    static : {
        /**put non instance specific methods here**/
        find : function(){},
        where : function(){},
        select : function(){},
        sanitize : function(){},
        create : function(){},
        columns : function(){},
        load : function(){}

    }
}, db);