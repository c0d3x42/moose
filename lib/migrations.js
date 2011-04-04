var utility = require("./util"),
        hitch = utility.hitch,
        adapters = require("./adapters"),
        promise = require("./promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        fs = require("fs"),
        path = require("path"),
        tables = require("./table"),
        Table = tables.Table;

/*
 * Mixin for moose to support Migratons
 *
 * addes public methods
 *  migrate - performs a migration
 *  createTable - creates a table
 *  dropTable - drops a table
 *  alterTable - alters a table
 *
 *  This class should not be instantiated directly!!!
 *
 * */
module.exports = exports = utility.define(null, {
    instance : {
        constructor : function() {
            this.__deferredMigrations = [];
        },

        /*
         * Private
         *
         * Performs the deferred migrations function
         *
         * Used by create/drop/alter Table functions when within a migraton
         * */
        __migrateFun : function(fun, arg, conn) {
            var ret = new Promise();
            var adapter = adapters[this.type];
            var connection = conn || this.getConnection();
            adapter[fun](arg, conn).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

        /*
         * Public
         *
         * Creates a new table
         *
         * tableName - the name of the table to create
         * cb - this funciton is callback with the table
         *      - All table properties should be specified within this block
         *
         * return Promise
         * Example : moose.createTable("test", function(table){
         *     table.column("id", types.INT())
         *     table.primaryKey("id");
         * });
         *
         * NOTE if used within a migration the promise is called back with a function
         * should mainly be used within a migration
         * */
        createTable : function(tableName, cb) {
            var table = new Table(tableName, {});
            cb(table);
            //add it to the moose schema map
            this.schemas[tableName] = table;
            if (!this.__inMigration) {
                return this.__migrateFun("createTable", table, this.getConnection());
            } else {
                var ret = new Promise();
                ret.callback(hitch(this, "__migrateFun", "createTable", table));
                this.__deferredMigrations.push(ret);
                return ret;
            }
        },


        /*
         * Public
         *
         * Drops a table
         *
         * table - table to drop
         *
         * Return : Promise
         *
         * Example : moose.dropTable("test");
         *
         * NOTE if used within a migration the promise is callback with a function
         * should mainly be used within a migration
         * */
        dropTable : function(table) {
            table = new Table(table);
            //delete from the moose schema map
            delete this.schemas[table];
            if (!this.__inMigration) {
                return this.__migrateFun("dropTable", "table", this.getConnection());
            } else {
                var ret = new Promise();
                ret.callback(hitch(this, "__migrateFun", "dropTable", table));
                this.__deferredMigrations.push(ret);
                return ret;
            }
        },

        /*
         * Public
         * Alters a table
         *
         * name : the table to alter
         *
         * cb : function to calback with table to alter
         *
         * Return : Promise
         *
         * Example : moose.alterTable("test", function(table){
         *     table.rename("test2");
         *     table.addColumn("myColumn", types.STRING());
         * });
         *
         * NOTE if used within a migration the promise is callback with a function
         * should mainly be used within a migration
         * */
        alterTable : function(name, cb) {
            var ret = new Promise();
            delete this.schemas[name];
            if (!this.__inMigration) {
                this.loadSchema(name).then(function(table) {
                    cb(table);
                    this.__migrateFun("alterTable", table).then(hitch(ret, "callback"), hitch(ret, "errback"));
                }, hitch(ret, "errback"));
            } else {
                this.loadSchema(name).then(hitch(this, function(table) {
                    cb(table);
                    ret.callback(hitch(this, "__migrateFun", "alterTable", table));
                    delete this.schemas[name];
                }), hitch(ret, "errback"));
                this.__deferredMigrations.push(ret);
                return ret;
            }
        },

        /*
         *   Private
         * */
        __doMigrate : function(fun, conn) {
            var ret = new Promise();
            this.__inMigration = true;
            fun();
            //all calls should be deferred
            if (this.__deferredMigrations.length) {
                var defList = new PromiseList(this.__deferredMigrations);
                defList.then(hitch(this, function(res) {
                    //map my to retrieve the actual responses
                    //and call the associated method
                    var ps = [], f;
                    for (var i = 0, len = res.length; i < len; i++) {
                        f = res[i][1];
                        if (typeof  f == "function") {
                            ps[i] = f(conn);
                        } else {
                            //todo move this to a common error handler like moose.error
                            throw new Error("Unexpected error");
                        }
                    }
                    //listen for the promises to complete
                    new PromiseList(ps).then(hitch(ret, "callback"), hitch(ret, "errback"));
                    //reset for another migration
                    this.__deferredMigrations.length = 0;
                }), function(err) {
                    for (var len = err.length, i = len - 1; i > 0; i--) {
                        console.error(err[i]);
                    }
                    conn.rollback(hitch(ret, "errback", err));
                });
            } else {
                promise.callback();
            }
            this.__inMigration = false;
            return ret;
        },

        /**
         *  options : Object
         *  options.connection : @see moose.createConnection
         *  options.dir : name of directory where migrations are located
         *  options.up : boolen, if true will migrate up otherwise down
         *  options.start : the migration to start at
         *  options.end : the migration to end at this, end is inclusive
         *
         *  Each migration file should have one/both functions up or down
         *
         *  Example migration file
         *
         *  exports.up = function(){
         *     moose.createTable("test", function(table){
         *          table.column("id", types.INT())
         *          table.primaryKey("id");
         *      });
         *  }
         *
         *  exports.down = function(){
         *      moose.dropTable("test");
         *  }
         *
         * Example migration directory
         *  -Dir
         *      -migration.0.js
         *      -migration.1.js
         *      .
         *      .
         *      .
         *      -migration.n.js
         *  NOTE: if you start at 0 and end at 0 your migrations will inlude the file only at "migrationName".0.js
         *        if you specify start : 0 and end 1 then your migrations will include files "migraiton0".0.js and "migration1".1.js,
         *        the names being whatever you specify before the *.0 and *.1
         */
        migrate : function(options) {
            var promise = new Promise();
            var dir, file;
            var start = typeof options.end == "number" ? options.start : 0,
                    end = typeof options.end == "number" ? options.end : Infinity;
            //if a coonection is not provided or we dont already have a connection
            //throw an error
            if (options.connection || this.__connectionReady) {
                //set our current state, allows us to push any create/alter/delete
                //transactions into our deferred

                //init our connecton information
                !this.__connectionReady && this.createConnection(options.connection);
                if (options.dir) dir = path.resolve(process.cwd(), options.dir);
                //read the directory
                fs.readdir(dir, hitch(this, function(err, files) {
                    var funs = [], fun = options.up ? "up" : "down", parts, num, file, extName = path.extname, baseName = path.basename;
                    for (var i = 0, len = files.length; i < len; i++) {
                        file = files[i];
                        if (extName(file) == ".js") {
                            //its a js file otherwise ignore
                            //split the path to get the num
                            parts = baseName(file, ".js").split(".");
                            //get the migration number
                            num = parseInt(parts.pop());
                            //if it is a valid index
                            if (!isNaN(num) && num >= start && num <= end) {
                                var cls = require(path.resolve(dir, file));
                                if (cls[fun]) {
                                    //add it
                                    funs[num - start] = hitch(cls, fun);
                                }
                            }
                        }
                    }
                    if (!options.up) {
                        funs.reverse();
                    }
                    var conn = this.transaction();
                    if (conn) {
                        if (funs.length) {
                            i = 0,len = funs.length;
                            var doMig = hitch(this, this.__doMigrate);

                            var next = hitch(this, function(res) {
                                if (i < len) {
                                    doMig(funs[i], conn).then(next, function(err) {
                                        console.log(err);
                                        conn.rollback(hitch(promise, "errback", err));
                                    });
                                } else {
                                    conn.commit().then(hitch(promise, "callback"));
                                }
                                i++;
                            });
                            next();
                        } else {
                            promise.callback();
                        }


                    }
                }));
            } else {
                throw new Error("when migrating a connection is required")
            }
            return promise;
        }

    }
});