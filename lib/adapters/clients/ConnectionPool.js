var comb = require("comb");


/**
 * @class Base class for all connection pools
 *
 * @name ConnectionPool
 * @augments comb.collections.Pool
 * @memberOf moose.adapters.client
 */
var ConnectionPool = comb.define(comb.collections.Pool, {

    instance : {
	    /**@lends moose.adapters.client.ConnectionPool.prototype*/

        constructor : function(options) {
            options = options || {};
            if (!options.database) throw "moose.adapters.clients.ConnectionPool : a database is required to initialize the pool.";
            options.minObjects = options.minConnections || 0;
            options.maxObjects = options.maxConnections || 10;
            this.database = options.database;
            this.__deferredQueue = new comb.collections.Queue();
            this._options = options;
            this.super(arguments);
        },

        /**
         * Checks all deferred connection requests.
         */
        __checkQueries : function() {
            var fc = this.freeCount, def, defQueue = this.__deferredQueue;
            while (fc-- >= 0 && defQueue.count) {
                def = defQueue.dequeue();
                var conn = this.getObject();
                if (conn) {
                    def.callback(conn);
                } else {
                    //we didnt get a conneciton so assume we're out.
                    break;
                }
                fc--;
            }
        },

        /**
         * Performs a query on one of the connection in this Pool.
         *
         * @return {comb.Promise} A promise to called back with a connection.
         */
        getConnection : function() {
            var ret = new comb.Promise();
            var conn = this.getObject();
            if (!conn) {
                //we need to deffer it
                this.__deferredQueue.enqueue(ret);
            } else {
                ret.callback(conn);
            }
            return ret;
        },

        /**
         * Override comb.collections.Pool to allow async validation to allow
         * pools to do any calls to reset a connection if it needs to be done.
         *
         * @param {*} connection the connection to return.
         *
         */
        returnObject : function(obj) {
            if (this.count <= this.__maxObjects) {
                this.validate(obj).then(comb.hitch(this, function(valid) {
                    if (valid) {
                        this.__freeObjects.enqueue(obj);
                        var index;
                        if ((index = this.__inUseObjects.indexOf(obj)) > -1)
                            this.__inUseObjects.splice(index, 1);
                        this.__checkQueries();
                    } else {
                        this.removeObject(obj);
                    }
                }));
            } else {
                this.removeObject(obj);
            }
        },

	    /**
	     * Removes a connection from the pool.
	     * @param conn
	     */
	    removeConnection : function(conn){
		    this.removeObject(conn);
	    },

        /**
         * Return a connection to the pool.
         *
         * @param {*} connection the connection to return.
         *
         * @return {*} an adapter specific connection.
         */
        returnConnection : function(connection) {
            this.returnObject(connection);
        },

        createObject : function() {
            return this.createConnection();
        },

        /**
         * Override to implement the closing of all connections.
         *
         * @return {comb.Promise} called when all connections are closed.
         */
        endAll : function() {
            this.__ending = true;
            var conn, fQueue = this.__freeObjects, count = this.count, ps = [];
            while ((conn = this.__freeObjects.dequeue()) != undefined) {
                ps.push(this.closeConnection(conn));
            }
            var inUse = this.__inUseObjects;
            for (var i = inUse.length - 1; i >= 0; i--) {
                ps.push(this.closeConnection(inUse[i]));
            }
            this.__inUseObjects.length = 0;
            var pls = new comb.PromiseList(ps);
            return pls;
        },


        /**
         * Override to provide any additional validation. By default the promise is called back with true.
         *
         * @param {*} connection the conneciton to validate.
         *
         * @return {comb.Promise} called back with a valid or invalid state.
         */
        validate : function(conn) {
            var ret = new comb.Promise();
            ret.callback(true);
            return ret;
        },

        /**
         * Override to create connections to insert into this ConnectionPool.
         */
        createConnection : function() {
            throw "moose.adapters.clients.ConnectionPool : createConnection not implemented.";
        },

        /**
         * Override to implement close connection functionality;
         * @param {*} conn the connection to close;
         *
         * @return {comb.Promise} called back when the connection is closed.
         */
        closeConnection : function(conn) {
            throw "moose.adapters.clients.ConnectionPool : closeConnection not implemented.";
        }
    }

});
exports = module.exports = ConnectionPool;