var Client = require('mysql').Client,

var
moose = function(options) {

}

/*options = {
 host = 'localhost';
 port = 3306;
 user = null;
 password = null;
 database = '';

 typeCast = true;
 flags = Client.defaultFlags;
 maxPacketSize = 0x01000000;
 charsetNumber = Client.UTF8_UNICODE_CI;
 debug = false;
 }

 */
var connect = function(options) {
    return new Client(options);
}