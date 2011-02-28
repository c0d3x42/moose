var util = require("../../util");

var stringDefaults = {
    allowNull : true,
    primaryKey : false,
    foreignKey : false,
    "default" : null,
    length : 255,
    description : ""
};

//String Types
var char = function(value, options) {
    var ops = utils.merge({type : "char"}, options);
    if (length > 255) {
        throw new Error("Max char type length is 255");
    }
    this.__defineSetter__("value", function(value) {
        if (typeof value != "string") {
            value = = "" + value;
        }
        if (value.length != this.length) {
            throw new Error("value not of specified length " + length);
        }
        this.value = value;
    });
    //This returns the column definition based off of the options
    this.__defineGetter__("sql", function(value) {
        var sql = "";
        this.value = value;
    });
};

char.fromSQL = function(value) {
    return new
};
char.prototype.toSQL = function() {
};

var varChar = function(value, options) {
};
varChar.prototype.fromSQL = function() {
};
varChar.prototype.toSQL = function() {
};

var tinyText = function(value, options) {
};
tinyText.prototype.fromSQL = function() {
};
tinyText.prototype.toSQL = function() {
};

var mediumText = function(value, options) {
};
mediumText.prototype.fromSQL = function() {
};
mediumText.prototype.toSQL = function() {
};

var longText = function(value, options) {
};
longText.prototype.fromSQL = function() {
};
longText.prototype.toSQL = function() {
};

var text = function(value, options) {
};
text.prototype.fromSQL = function() {
};
text.prototype.toSQL = function() {
};

var tinyBlob = function(value, options) {
};
tinyBlob.prototype.fromSQL = function() {
};
tinyBlob.prototype.toSQL = function() {
};

var mediumBlob = function(value, options) {
};
mediumBlob.prototype.fromSQL = function() {
};
mediumBlob.prototype.toSQL = function() {
};

var longBlob = function(value, options) {
};
longBlob.prototype.fromSQL = function() {
};
longBlob.prototype.toSQL = function() {
};

var blob = function(value, options) {
};
blob.prototype.fromSQL = function() {
};
blob.prototype.toSQL = function() {
};

var enum = function(value, options) {
};
enum.prototype.fromSQL = function() {
};
enum.prototype.toSQL = function() {
};

var Set = function(value, options) {
};
Set.prototype.fromSQL = function() {
};
Set.prototype.toSQL = function() {
};

//Number Types
var int = function(value, options) {
};
int.prototype.fromSQL = function() {
};
int.prototype.toSQL = function() {
};

var tinyInt = function(value, options) {
};
tinyInt.prototype.fromSQL = function() {
};
tinyInt.prototype.toSQL = function() {
};

var smallInt = function(value, options) {
};
smallInt.prototype.fromSQL = function() {
};
smallInt.prototype.toSQL = function() {
};

var mediumInt = function(value, options) {
};
mediumInt.prototype.fromSQL = function() {
};
mediumInt.prototype.toSQL = function() {
};

var bigInt = function(value, options) {
};
bigInt.prototype.fromSQL = function() {
};
bigInt.prototype.toSQL = function() {
};

var float = function(value, options) {
};
float.prototype.fromSQL = function() {
};
float.prototype.toSQL = function() {
};

var double = function(value, options) {
};
double.prototype.fromSQL = function() {
};
double.prototype.toSQL = function() {
};

var decimal = function(value, options) {
};
decimal.prototype.fromSQL = function() {
};
decimal.prototype.toSQL = function() {
};


//Date
var date = function(value, options) {
};
date.prototype.fromSQL = function() {
};
date.prototype.toSQL = function() {
};

var time = function(value, options) {
};
time.prototype.fromSQL = function() {
};
time.prototype.toSQL = function() {
};

var timestamp = function(value, options) {
};
timestamp.prototype.fromSQL = function() {
};
timestamp.prototype.toSQL = function() {
};

var year = function(value, options) {
};
year.prototype.fromSQL = function() {
};
year.prototype.toSQL = function() {
};

var dateTime = function(value, options) {
};
dateTime.prototype.fromSQL = function() {
};
dateTime.prototype.toSQL = function() {
};

//Boolean Types
var bool = function(value, options) {
};
bool.prototype.fromSQL = function() {
};
bool.prototype.toSQL = function() {
};

var Boolean = function(value, options) {
};
Boolean.prototype.fromSQL = function() {
};
Boolean.prototype.toSQL = function() {
};

var char = function(value, options) {
};
char.prototype.fromSQL = function() {
};
char.prototype.toSQL = function() {
};


mysql.types = {
    //String Types
    CHAR :          char,
    VARCHAR :       varchar,
    TINYTEXT :      tinyText,
    MEDIUMTEXT :    mediumText
    LONGTEXT :      longText,
    BLOB :          blob,
    TINYBLOB :      tinyBlob,
    MEDIUMBLOB :    mediumBlob,
    LONGBLOB :      longBlob,
    ENUM :          enum,
    SET :           Set,
    //Number Types
    INT :           int,
    TINYINT :       tinyInt,
    SMALLINT :      smallInt,
    MEDIUMINT :     mediumInt,
    BIGINT :        bigInt,
    FLOAT :         float,
    DOUBLE :        double
    DECIMAL :       decimal

    //Date Types
    DATE :          date,
    TIME :          time,
    TIMESTAMP :     timestamp,
    YEAR :          year,
    DATETIME :     dateTime,

    //Boolean Types
    BOOL :          bool,
    BOOLEAN :       Boolean
};

