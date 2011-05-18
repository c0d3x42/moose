var moose = require("../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        comb = require("comb");
var options = {
    connection : {user : "test", password : "testpass", database : 'test'},
    dir : "./migration",
    start : 0,
    up : true
};
var loadModels = function() {
    var ret = new comb.Promise();

    moose.migrate(options)
            .chain(comb.hitch(moose, "loadSchema", "employee"), comb.hitch(ret, "errback"))
            .then(function(employee) {
        var Employee = moose.addModel(employee);
        ret.callback();
    }, comb.hitch(console, "log"));

    return ret;
};

var dropModels = function() {
    var ret = new comb.Promise();
    options.up = false;
    moose.migrate(options).then(comb.hitch(ret, "callback"), comb.hitch(ret, "errback"));
    return ret;
};

var insert = function() {
    loadModels().then(function() {
        var Employee = moose.getModel("employee");
        var start = +new Date, inserts = 0, total = 10000;
        function insertOne() {
            var emp = new Employee({
                firstname : "First " + inserts,
                lastname : "Last " + inserts,
                midinitial : null,
                gender : inserts % 2 ? "M" : "F",
                street :  inserts + " nowhere st.",
                city : "NOWHERE"
            });
            emp.save().then(function() {
                inserts++;
                if (inserts < total) {
                    insertOne();
                } else {
                    var duration = (+new Date - start) / 1000,
                            insertsPerSecond = inserts / duration;
                    console.log('%d inserts / second', insertsPerSecond.toFixed(2));
                    console.log('%d ms', +new Date - start);
                    dropModels();
                }
            });
        }

        insertOne();
    });
};

insert();