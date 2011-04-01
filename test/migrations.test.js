var moose = require("../lib");

/*options : Object
 *  options.connection : @see moose.createConnection
 *  options.dir : name of directory where migrations are located
 *  options.up : boolen, if true will migrate up otherwise down
 *  options.start : the migration to start at
 *  options.end : the migration to end at*/

var options = {
    connection : {user : "test", password : "testpass", database : 'test'},
    dir : "./data/migrations/migrations",
    start : 0,
    up : false
}

moose.migrate(options).then(function() {
    moose.migrate(moose.merge(options, {up : true}))
            .chain(hitch(moose, "loadSchemas", ["works", "employee", "companyNew", "companyEmployee"])).then(function() {
        console.log(moose.getSchema("works").createTableSql);
        console.log(moose.getSchema("employee").createTableSql);
        console.log(moose.getSchema("companyNew").createTableSql);
        console.log(moose.getSchema("companyEmployee").createTableSql);
    })
});



