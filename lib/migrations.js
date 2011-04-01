var utility = require("./util"),
        hitch = utility.hitch,
        util = require('util'),
        adapters = require("./adapters"),
        promise = require("./promise"),
        Promise = promise.Promise,
        PromiseList = promise.PromiseList,
        fs = require("fs"),
        path = require("path"),
        tables = require("./table"),
        Table = tables.Table,
        AlterTable = tables.AlterTable;

module.exports = exports = utility.define(null, {
    instance : {
        constructor : function() {
            this.__deferredMigrations = [];
        },

        __migrateFun : function(fun, arg, conn) {
            var ret = new Promise();
            var adapter = adapters[this.type];
            var connection = this.getConnection();
            adapter[fun](arg, conn).then(hitch(ret, "callback"), hitch(ret, "errback"));
            return ret;
        },

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


        dropTable : function(table) {
            table = new Table(table);
            //delete from the mose schema map
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

        alterTable : function(name, cb) {
            var ret = new Promise();
            if (!this.__inMigration) {
                this.loadSchema(name).then(function(table) {
                    cb(table);
                    this.__migrateFun("alterTable", table).then(hitch(ret, "callback"), hitch(ret, "errback"));
                }, hitch(ret, "errback"));
            } else {
                this.loadSchema(name).then(hitch(this,function(table) {
                    cb(table);
                    ret.callback(hitch(this, "__migrateFun", "alterTable", table));
                }), hitch(ret, "errback"));
                this.__deferredMigrations.push(ret);
                return ret;
            }
        },

        __doMigrate : function(fun, conn) {
            var ret = new Promise();
            this.__inMigration = true;
            fun()
            //all calls should be deferred
            if (this.__deferredMigrations.length) {
                var defList = new PromiseList(this.__deferredMigrations);
                defList.then(hitch(this, function(res) {
                    var ps = res.map(function(f) {
                        return f[1](conn);
                    }, this);
                    new PromiseList(ps).then(hitch(ret, "callback"), hitch(ret, "errback"));
                    //reset for another migration
                    this.__deferredMigrations.length = 0;
                }), function(err) {
                    console.log("Error migrating");
                    err.forEach(function(e) {
                        console.error(e)
                    });
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
         *  options.end : the migration to end at
         */
        migrate : function(options) {
            var promise = new Promise();
            var dir, file;
            var start = options.start || 0, end = options.end || Infinity;
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
                    var funs = [], fun = options.up ? "up" : "down";
                    files.forEach(function(file) {
                        if (path.extname(file) == ".js") {
                            //its a js file otherwise ignore
                            var parts = path.basename(file, ".js");
                            //split the path to get the num
                            parts = parts.split(".");
                            //get the migration number
                            var num = parseInt(parts.pop());
                            //if it is a valid index
                            if (!isNaN(num) && num >= start && num < end) {
                                var cls = require(path.resolve(dir, file));
                                if (cls[fun]) {
                                    //add it
                                    funs[num - start] = hitch(cls, fun);
                                }
                            }
                        }
                    });
                    if (!options.up) {
                        funs.reverse();
                    }
                    var conn = this.transaction();
                    if (conn) {
                        if (funs.length) {
                            var  i = 0;
                            function next(res) {
                                if (i < funs.length) {
                                    this.__doMigrate(funs[i], conn).then(hitch(this, next), function(err) {
                                        console.log("Error migrating");
                                        console.log(err);
                                        conn.rollback(hitch(promise, "errback", err));
                                    });
                                } else {
                                    console.log("Committing migration");
                                    conn.commit().then(hitch(promise, "callback"));
                                }
                                i++;
                            }
                            next.apply(this);
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