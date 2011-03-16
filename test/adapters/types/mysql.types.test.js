var vows = require('vows'),
        assert = require('assert'),
        types = require("../../../lib").adapters.mysql.types;

var suite = vows.describe('mysql types');

/*
 INT: [Function],
 TINYINT",
 SMALLINT",
 MEDIUMINT",
 BIGINT",
 FLOAT",
 DOUBLE",
 DECIMAL",

 DATE",
 TIME",
 TIMESTAMP",
 YEAR",
 DATETIME",
 BOOL",
 BOOLEAN:

 allowNull : true,
 primaryKey : false,
 foreignKey : false,
 "default" : null,
 unique : false,
 description : ""  */


["CHAR", "VARCHAR", "TINYTEXT"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(255)");
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(255) NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(255) NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, and length'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, primaryKey : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, primaryKey : true, "default" : "A"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY DEFAULT 'A' UNIQUE");
        }
    };

    batch['when creating ' + type + ' type from sql'] = {
        topic: function () {
            return types[type]({length : 5});
        },

        'we get ': function (topic) {
            assert.equal(topic.fromSql("HELLO"), "HELLO");
            assert.equal(topic.toSql("HELLO"), "HELLO");
            assert.isTrue(topic.check("HELLO"));
            assert.throws((function(){topic.toSql(1)}));
            assert.throws((function(){topic.toSql(true)}));
            assert.throws((function(){topic.toSql(new Date())}));
            assert.throws((function(){topic.check(1)}));
            assert.throws((function(){topic.check(true)}));
            assert.throws((function(){topic.check(new Date())}));
            if(type == "CHAR"){
               assert.throws((function(){topic.check("HELLOO")}));
            }
        }
    };
    suite.addBatch(batch);

});
["MEDIUMTEXT", "LONGTEXT"].forEach(function(type) {
    var batch = {};
    var length = type=="MEDIUMTEXT" ? "(" + 16777215 + ")" : "(" + 4294967295 + ")";
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + length);
        }
    };

    batch['when creating ' + type + length +' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + length +" NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + length +" NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, and length'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, primaryKey : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, primaryKey : true, "default" : "A"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY DEFAULT 'A' UNIQUE");
        }
    };

    batch['when creating ' + type + ' type from sql'] = {
        topic: function () {
            return types[type]({length : 5});
        },

        'we get ': function (topic) {
            assert.equal(topic.fromSql("HELLO"), "HELLO");
            assert.equal(topic.toSql("HELLO"), "HELLO");
            assert.isTrue(topic.check("HELLO"));
            assert.throws((function(){topic.toSql(1)}));
            assert.throws((function(){topic.toSql(true)}));
            assert.throws((function(){topic.toSql(new Date())}));
            assert.throws((function(){topic.check(1)}));
            assert.throws((function(){topic.check(true)}));
            assert.throws((function(){topic.check(new Date())}));
            if(type == "CHAR"){
               assert.throws((function(){topic.check("HELLOO")}));
            }
        }
    };
    suite.addBatch(batch);

});

["ENUM", "SET"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]({enums : ["A", "B"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "('A','B')");
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false, enums : ["A", "B"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "('A','B') NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, enums : ["A", "B"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "('A','B') NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, and length'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, primaryKey : true, enums : ["A", "B"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "('A','B') NOT NULL PRIMARY KEY UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, primaryKey : true, "default" : "A", enums : ["A", "B"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "('A','B') NOT NULL PRIMARY KEY DEFAULT 'A' UNIQUE");
        }
    };

    batch['when creating ' + type + ' type from sql'] = {
        topic: function () {
            return types[type]({enums : ['A', 'B']});
        },

        'we get ': function (topic) {
            assert.equal(topic.fromSql("A"), "A");
            assert.equal(topic.toSql("A"), "A");
            assert.isTrue(topic.check("A"));
            assert.throws((function(){topic.fromSql(1)}));
            assert.throws((function(){topic.fromSql(new Date())}));
            assert.throws((function(){topic.fromSql(true)}));
            assert.throws((function(){topic.toSql(1)}));
            assert.throws((function(){topic.toSql("C")}));
            assert.throws((function(){topic.toSql(true)}));
            assert.throws((function(){topic.toSql(new Date())}));
            assert.throws((function(){topic.check(1)}));
            assert.throws((function(){topic.check("C")}));
            assert.throws((function(){topic.check(true)}));
            assert.throws((function(){topic.check(new Date())}));
        }
    };

    suite.addBatch(batch);
});


["INT","TINYINT","SMALLINT",
    "MEDIUMINT", "BIGINT"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type);
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, unsigned, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY UNIQUE UNSIGNED");
        }
    };


    batch['when creating ' + type + ' type with null, unique, length, unisgned, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true, "default" : 10, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY DEFAULT 10 UNIQUE UNSIGNED");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, default, unsigned, and autoIncrement'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true, "default" : 10, autoIncrement : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY AUTO_INCREMENT DEFAULT 10 UNIQUE UNSIGNED");
        }
    };

    batch['when creating ' + type + ' type from sql'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.fromSql("10"), 10);
            assert.equal(topic.toSql(10), 10);
            assert.isTrue(topic.check(10));
            assert.throws((function(){topic.fromSql(new Date())}));
            assert.throws((function(){topic.fromSql("A")}));
            assert.throws((function(){topic.fromSql(true)}));
            assert.throws((function(){topic.toSql(new Date())}));
            assert.throws((function(){topic.toSql("A")}));
            assert.throws((function(){topic.toSql(true)}));
            assert.throws((function(){topic.check(new Date())}));
            assert.throws((function(){topic.check("A")}));
            assert.throws((function(){topic.check(true)}));
        }
    };
    suite.addBatch(batch);
});

["FLOAT","DOUBLE","DECIMAL"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type);
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, unsigned, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY UNIQUE UNSIGNED");
        }
    };


    batch['when creating ' + type + ' type with null, unique, length, unisgned, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true, "default" : 10, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY DEFAULT 10 UNIQUE UNSIGNED");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, default, unsigned, and autoIncrement'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, primaryKey : true, "default" : 10, autoIncrement : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL PRIMARY KEY AUTO_INCREMENT DEFAULT 10 UNIQUE UNSIGNED");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, default, unsigned, digits, and autoIncrement'] = {
        topic: function () {
            return  types[type]({allowNull : false, digits : 3, unique : true, size : 10, primaryKey : true, "default" : 10, autoIncrement : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10,3) NOT NULL PRIMARY KEY AUTO_INCREMENT DEFAULT 10 UNIQUE UNSIGNED");
        }
    };

    batch['when creating ' + type + ' type from sql'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.fromSql("10.000"), 10.000);
            assert.equal(topic.toSql(10.000), "10.000");
            assert.isTrue(topic.check(10.000));
            assert.throws((function(){topic.fromSql(newDate)}));
            assert.throws((function(){topic.fromSql("A")}));
            assert.throws((function(){topic.fromSql(true)}));
            assert.throws((function(){topic.toSql(new Date)}));
            assert.throws((function(){topic.toSql("A")}));
            assert.throws((function(){topic.toSql(true)}));
            assert.throws((function(){topic.check(new Date)}));
            assert.throws((function(){topic.check("A")}));
            assert.throws((function(){topic.check(true)}));
        }
    };

    suite.addBatch(batch);
});

["DATE", "TIME", "TIMESTAMP","YEAR","DATETIME"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type);
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, primaryKey : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL PRIMARY KEY UNIQUE");
        }
    };
    var def = "", date = null;
    switch (type) {
        case  "DATE" :
            def = "1999-10-10";
            date = new Date(Date.parse(def));
            break;
        case  "TIME" :
            def = "12:12:12";
            date = new Date();
            date.setHours(12, 12, 12);
            break;
        case  "TIMESTAMP" :
        case  "DATETIME" :
            def = "1999-10-10 12:12:12";
            date = new Date(Date.parse(def));
            break;
        case  "YEAR" :
            def = "1999";
            date = new Date(Date.parse(def));
            break;
    }

    batch['when creating ' + type + ' type with null, unique, default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, primaryKey : true, "default" : def});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL PRIMARY KEY DEFAULT '" + def + "' UNIQUE");
        }
    };

    batch['when creating ' + type + ' type from sql'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.fromSql(def).toString(), date);
            assert.equal(topic.toSql(date).toString(), def);
            assert.isTrue(topic.check(date));
            assert.throws((function(){topic.fromSql(1)}));
            assert.throws((function(){topic.fromSql("A")}));
            assert.throws((function(){topic.fromSql(true)}));
            assert.throws((function(){topic.toSql(1)}));
            assert.throws((function(){topic.toSql("A")}));
            assert.throws((function(){topic.toSql(true)}));
            assert.throws((function(){topic.check(1)}));
            assert.throws((function(){topic.check("A")}));
            assert.throws((function(){topic.check(true)}));
        }
    };

    suite.addBatch(batch);
});

["BOOL", "BOOLEAN"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type);
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, primaryKey : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL PRIMARY KEY UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, primaryKey : true, "default" : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL PRIMARY KEY DEFAULT true UNIQUE");
        }
    };
    batch['when creating ' + type + ' type from sql'] = {
           topic: function () {
               return types[type]();
           },

           'we get ': function (topic) {
               assert.equal(topic.fromSql("true"), true);
               assert.equal(topic.toSql(true), true);
               assert.isTrue(topic.check(true));
               assert.equal(topic.fromSql("false"), false);
               assert.equal(topic.toSql(false), false);
               assert.isTrue(topic.check(false));
               assert.throws((function(){topic.fromSql(1)}));
               assert.throws((function(){topic.fromSql("A")}));
               assert.throws((function(){topic.fromSql(new Date())}));
               assert.throws((function(){topic.toSql(1)}));
               assert.throws((function(){topic.toSql("A")}));
               assert.throws((function(){topic.toSql(new Date())}));
               assert.throws((function(){topic.check(1)}));
               assert.throws((function(){topic.check("A")}));
               assert.throws((function(){topic.check(new Date())}));
           }
       };

    suite.addBatch(batch);
});

suite.export(module);
