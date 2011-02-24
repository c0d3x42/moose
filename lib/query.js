

   // Methods that return modified datasets


var createSQL = function(){

};

var Query = function(db, model, adapter) {
    this.model = model || {};
    this.query = "";
    this.options = [];
    this._queries = [];
    this.db = db;
}

Query.prototype._canBeNext = function(type){

};

Query.prototype._enqueue = function(type, fun){

};


Query.prototype.find = function(options){

};

Query.prototype.where = function(options){

};

Query.prototype.select = function(options){

};

Query.prototype.order = function(options) {

};

Query.prototype.orderBy = function(options) {

};

Query.prototype.join = function(options) {
};

Query.prototype.grep = function(options) {
};

Query.prototype.group = function(options) {
};

Query.prototype.count = function(options) {
};

Query.prototype.groupAndCount = function(options) {
};

Query.prototype.having = function(options) {
};

Query.prototype.and = function(options) {

};

Query.prototype.or = function(options) {

};

Query.prototype.execute = function(options) {

};