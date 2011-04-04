var define = require("../utilities/define").define;

/**
 * Time stamp plugin to support creating timestamp
 *
 * Model.timestamp(options);
 *
 * Option values
 *
 *      updated - the name of the column to set the updated timestamp on
 *          default - 'updated'
 *      created - the name of the column to set the created timestamp on
 *          default - created
 *      updateOnCreate - Set to true to set the updated column on creation
 *          default - false
 */
module.exports = exports = define(null, {

    static : {
        timestamp : function(options){
            options = options || {};
            var updateColumn = options.updated || "updated";
            var createdColumn = options.created || "created";
            var updateOnCreate = options.updateOnCreate || false;
            this.pre("save", function(next){
                this[createdColumn] = new Date();
                if(updateOnCreate){
                    this[updateColumn] = new Date();
                }
                next();
            });
            this.pre("update", function(next){
                this[updateColumn] = new Date();
                next();
            });
        }
    }

});