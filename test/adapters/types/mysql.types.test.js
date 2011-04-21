var vows = require('vows'),
        assert = require('assert'),
        adapter = require("../../../lib").adapters.mysql,
        comb = require("comb"),
        types = adapter.types;

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
 "default" : null,
 unique : false,
 description : ""  */


["CHAR", "VARCHAR"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(255) NULL");
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
            return  types[type]({allowNull : false, unique : true, length : 10});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, "default" : "A"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) NOT NULL DEFAULT 'A' UNIQUE");
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
            assert.throws((function() {
                topic.toSql(1);
            }));
            assert.throws((function() {
                topic.toSql(true);
            }));
            assert.throws((function() {
                topic.toSql(new Date());
            }));
            assert.throws((function() {
                topic.check(1);
            }));
            assert.throws((function() {
                topic.check(true);
            }));
            assert.throws((function() {
                topic.check(new Date());
            }));
            if (type == "CHAR") {
                assert.throws((function() {
                    topic.check("HELLOO");
                }));
            }
        }
    };
    suite.addBatch(batch);

});
["TINYTEXT", "MEDIUMTEXT", "LONGTEXT"].forEach(function(type) {
    var batch = {};
    batch['when creating ' + type + ' type'] = {
        topic: function () {
            return types[type]();
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NULL");
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

    batch['when creating ' + type + ' type with null, unique, and length'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, "default" : "A"});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL DEFAULT 'A' UNIQUE");
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
            assert.throws((function() {
                topic.toSql(1);
            }));
            assert.throws((function() {
                topic.toSql(true);
            }));
            assert.throws((function() {
                topic.toSql(new Date());
            }));
            assert.throws((function() {
                topic.check(1);
            }));
            assert.throws((function() {
                topic.check(true);
            }));
            assert.throws((function() {
                topic.check(new Date());
            }));
            if (type == "CHAR") {
                assert.throws((function() {
                    topic.check("HELLOO");
                }));
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
            assert.equal(topic.sql, type + "('A','B') NULL");
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
            return  types[type]({allowNull : false, unique : true, length : 10, enums : ["A", "B"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "('A','B') NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, length : 10, "default" : "A", enums : ["A", "B"]});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "('A','B') NOT NULL DEFAULT 'A' UNIQUE");
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
            assert.throws((function() {
                topic.fromSql(1);
            }));
            assert.throws((function() {
                topic.fromSql(new Date());
            }));
            assert.throws((function() {
                topic.fromSql(true);
            }));
            assert.throws((function() {
                topic.toSql(1);
            }));
            assert.throws((function() {
                topic.toSql("C");
            }));
            assert.throws((function() {
                topic.toSql(true);
            }));
            assert.throws((function() {
                topic.toSql(new Date());
            }));
            assert.throws((function() {
                topic.check(1);
            }));
            assert.throws((function() {
                topic.check("C");
            }));
            assert.throws((function() {
                topic.check(true);
            }));
            assert.throws((function() {
                topic.check(new Date());
            }));
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
            assert.equal(topic.sql, type + " SIGNED NULL");
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " SIGNED NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " SIGNED NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) SIGNED NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, unsigned, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) UNSIGNED NOT NULL UNIQUE");
        }
    };


    batch['when creating ' + type + ' type with null, unique, length, unisgned, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, "default" : 10, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) UNSIGNED NOT NULL DEFAULT 10 UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, default, unsigned, and autoIncrement'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 10 UNIQUE");
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
            assert.throws((function() {
                topic.fromSql(new Date());
            }));
            assert.throws((function() {
                topic.fromSql("A");
            }));
            assert.throws((function() {
                topic.fromSql(true);
            }));
            assert.throws((function() {
                topic.toSql(new Date());
            }));
            assert.throws((function() {
                topic.toSql("A");
            }));
            assert.throws((function() {
                topic.toSql(true);
            }));
            assert.throws((function() {
                topic.check(new Date());
            }));
            assert.throws((function() {
                topic.check("A");
            }));
            assert.throws((function() {
                topic.check(true);
            }));
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
            assert.equal(topic.sql, type + " SIGNED NULL");
        }
    };

    batch['when creating ' + type + ' type with null'] = {
        topic: function () {
            return  types[type]({allowNull : false});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " SIGNED NOT NULL");
        }
    };

    batch['when creating ' + type + ' type with null and unique'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " SIGNED NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) SIGNED NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, unsigned, and size'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) UNSIGNED NOT NULL UNIQUE");
        }
    };


    batch['when creating ' + type + ' type with null, unique, length, unisgned, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, "default" : 10, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) UNSIGNED NOT NULL DEFAULT 10 UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, default, unsigned, and autoIncrement'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 10 UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, default, unsigned, digits, and autoIncrement'] = {
        topic: function () {
            return  types[type]({allowNull : false, digits : 3, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + "(10,3) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 10 UNIQUE");
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
            assert.throws((function() {
                topic.fromSql(newDate);
            }));
            assert.throws((function() {
                topic.fromSql("A");
            }));
            assert.throws((function() {
                topic.fromSql(true);
            }));
            assert.throws((function() {
                topic.toSql(new Date);
            }));
            assert.throws((function() {
                topic.toSql("A");
            }));
            assert.throws((function() {
                topic.toSql(true);
            }));
            assert.throws((function() {
                topic.check(new Date);
            }));
            assert.throws((function() {
                topic.check("A");
            }));
            assert.throws((function() {
                topic.check(true);
            }));
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
            assert.equal(topic.sql, type + (type == "TIMESTAMP" ? " NOT NULL" : " NULL"));
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
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL UNIQUE");
        }
    };
    var def = "", date = null;
    switch (type) {
        case  "DATE" :
            def = "1999-10-10";
            date = comb.date.parse(def, "yyyy-MM-dd");
            break;
        case  "TIME" :
            def = "12:12:12";
            date = comb.date.parse(def, "h:m:s");
            break;
        case  "TIMESTAMP" :
        case  "DATETIME" :
            def = "1999-10-10 12:12:12";
            date = comb.date.parse(def, "yyy-MM-dd h:m:s");
            break;
        case  "YEAR" :
            def = "1999";
            date = comb.date.parse(def, "yyyy");
            break;
    }

    batch['when creating ' + type + ' type with null, unique, default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, "default" : def});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL DEFAULT '" + def + "' UNIQUE");
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
            assert.throws((function() {
                topic.fromSql(1);
            }));
            assert.throws((function() {
                topic.fromSql("A");
            }));
            assert.throws((function() {
                topic.fromSql(true);
            }));
            assert.throws((function() {
                topic.toSql(1);
            }));
            assert.throws((function() {
                topic.toSql("A");
            }));
            assert.throws((function() {
                topic.toSql(true);
            }));
            assert.throws((function() {
                topic.check(1);
            }));
            assert.throws((function() {
                topic.check("A");
            }));
            assert.throws((function() {
                topic.check(true);
            }));
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
            assert.equal(topic.sql, type + " NULL");
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
            return  types[type]({allowNull : false, unique : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL UNIQUE");
        }
    };

    batch['when creating ' + type + ' type with null, unique, length, and default'] = {
        topic: function () {
            return  types[type]({allowNull : false, unique : true, "default" : true});
        },

        'we get ': function (topic) {
            assert.equal(topic.sql, type + " NOT NULL DEFAULT true UNIQUE");
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
            assert.throws((function() {
                topic.fromSql(1);
            }));
            assert.throws((function() {
                topic.fromSql("A");
            }));
            assert.throws((function() {
                topic.fromSql(new Date());
            }));
            assert.throws((function() {
                topic.toSql(1);
            }));
            assert.throws((function() {
                topic.toSql("A");
            }));
            assert.throws((function() {
                topic.toSql(new Date());
            }));
            assert.throws((function() {
                topic.check(1);
            }));
            assert.throws((function() {
                topic.check("A");
            }));
            assert.throws((function() {
                topic.check(new Date());
            }));
        }
    };

    suite.addBatch(batch);
});

suite.addBatch({

    "foreign key with string" : {
        topic: function () {
            return adapter.foreignKey("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn)");
        }
    },

    "foreign key with object" : {
        topic: function () {
            return adapter.foreignKey({myColumn : {otherTable : "otherTableColumn"}, myColumn2 : {otherTable2 : "otherTableColumn2"}});
        },

        'we get ': function (topic) {
            assert.equal(topic, "FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn),FOREIGN KEY (myColumn2) REFERENCES otherTable2 (otherTableColumn2)");
        }
    },


    "foreign key with array" : {
        topic: function () {
            return adapter.foreignKey(["myColumn", "myColumn2"], {otherTable : ["otherTableColumn", "otherTableColumn2"]});
        },

        'we get ': function (topic) {
            assert.equal(topic, "CONSTRAINT fk_myColumnMyColumn2 FOREIGN KEY (myColumn,myColumn2) REFERENCES otherTable (otherTableColumn,otherTableColumn2)");
        }
    },

    "when adding a foreign key with string" : {
        topic: function () {
            return adapter.addForeignKey("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn)");
        }
    },

    "when adding a foreign key with object" : {
        topic: function () {
            return adapter.addForeignKey({myColumn : {otherTable : "otherTableColumn"}, myColumn2 : {otherTable2 : "otherTableColumn2"}});
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD FOREIGN KEY (myColumn) REFERENCES otherTable (otherTableColumn),ADD FOREIGN KEY (myColumn2) REFERENCES otherTable2 (otherTableColumn2)");
        }
    },


    "when adding a foreign key with array" : {
        topic: function () {
            return adapter.addForeignKey(["myColumn", "myColumn2"], {otherTable : ["otherTableColumn", "otherTableColumn2"]});
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD CONSTRAINT fk_myColumnMyColumn2 FOREIGN KEY (myColumn,myColumn2) REFERENCES otherTable (otherTableColumn,otherTableColumn2)");
        }
    },

    "when dropping a foreign key with string" : {
        topic: function () {
            return adapter.dropForeignKey("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "DROP FOREIGN KEY myColumn");
        }
    },

    "when dropping a foreign key with object" : {
        topic: function () {
            return adapter.dropForeignKey({myColumn : {otherTable : "otherTableColumn"}, myColumn2 : {otherTable2 : "otherTableColumn2"}});
        },

        'we get ': function (topic) {
            assert.equal(topic, "DROP FOREIGN KEY myColumn,DROP FOREIGN KEY myColumn2");
        }
    },


    "when dropping a foreign key with array" : {
        topic: function () {
            return adapter.dropForeignKey(["myColumn", "myColumn2"], {otherTable : ["otherTableColumn", "otherTableColumn2"]});
        },

        'we get ': function (topic) {
            assert.equal(topic, "DROP FOREIGN KEY fk_myColumnMyColumn2");
        }
    }
});

suite.addBatch({
    "when creating an unique constraint with a string" : {
        topic: function () {
            return adapter.unique("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "UNIQUE (myColumn)");
        }
    },

    "when creating an unique constraint with an array" : {
        topic: function () {
            return adapter.unique(["mycolumnOne", "myColumnTwo"]);
        },

        'we get ': function (topic) {
            assert.equal(topic, "CONSTRAINT uc_mycolumnOneMyColumnTwo UNIQUE (mycolumnOne,myColumnTwo)");
        }
    },
    "when adding an unique constraint with a string" : {
        topic: function () {
            return adapter.addUnique("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD UNIQUE (myColumn)");
        }
    },

    "when creating an unique constraint with an array" : {
        topic: function () {
            return adapter.addUnique(["mycolumnOne", "myColumnTwo"]);
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD CONSTRAINT uc_mycolumnOneMyColumnTwo UNIQUE (mycolumnOne,myColumnTwo)");
        }
    },

    "when dropping an unique constraint with a string" : {
        topic: function () {
            return adapter.dropUnique("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "DROP INDEX myColumn");
        }
    },

    "when dropping an unique constraint with an array" : {
        topic: function () {
            return adapter.dropUnique(["mycolumnOne", "myColumnTwo"]);
        },

        'we get ': function (topic) {
            assert.equal(topic, "DROP INDEX uc_mycolumnOneMyColumnTwo");
        }
    }
});


suite.addBatch({
    "when creating an primary key with a string" : {
        topic: function () {
            return adapter.primaryKey("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "PRIMARY KEY (myColumn)");
        }
    },

    "when creating an primary key with an array" : {
        topic: function () {
            return adapter.primaryKey(["mycolumnOne", "myColumnTwo"]);
        },

        'we get ': function (topic) {
            assert.equal(topic, "CONSTRAINT pk_mycolumnOneMyColumnTwo PRIMARY KEY (mycolumnOne,myColumnTwo)");
        }
    },

    "when adding a primary key with a string" : {
        topic: function () {
            return adapter.addPrimaryKey("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD PRIMARY KEY (myColumn)");
        }
    },

    "when creating a primary key with an array" : {
        topic: function () {
            return adapter.addPrimaryKey(["mycolumnOne", "myColumnTwo"]);
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD CONSTRAINT pk_mycolumnOneMyColumnTwo PRIMARY KEY (mycolumnOne,myColumnTwo)");
        }
    },

    "when dropping a primary key with a string" : {
        topic: function () {
            return adapter.dropPrimaryKey("myColumn", {otherTable : "otherTableColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "DROP PRIMARY KEY");
        }
    }
});

suite.addBatch({
    "when creating a column" : {
        topic: function () {
            return adapter.column("myColumn", types.FLOAT({allowNull : false, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true}));
        },

        'we get ': function (topic) {
            assert.equal(topic, "myColumn FLOAT(10) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 10 UNIQUE");
        }
    },

    "when adding a column" : {
        topic: function () {
            return adapter.addColumn("myColumn", types.FLOAT({allowNull : false, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true}));
        },

        'we get ': function (topic) {
            assert.equal(topic, "ADD COLUMN myColumn FLOAT(10) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 10 UNIQUE");
        }
    },

    "when dropping a column" : {
        topic: function () {
            return adapter.dropColumn("myColumn");
        },

        'we get ': function (topic) {
            assert.equal(topic, "DROP COLUMN myColumn");
        }
    },

    "when altering a columns type" : {
        topic: function () {
            return adapter.alterColumn("myColumn", {type : types.FLOAT({allowNull : false, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true})});
        },

        'we get ': function (topic) {
            assert.equal(topic, "MODIFY COLUMN myColumn FLOAT(10) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 10 UNIQUE");
        }
    },

    "when altering a columns name" : {
        topic: function () {
            return adapter.alterColumn("myColumn", {original : types.FLOAT({allowNull : false, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true}), newName : "myNewColumn"});
        },

        'we get ': function (topic) {
            assert.equal(topic, "CHANGE COLUMN myColumn myNewColumn FLOAT(10) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 10 UNIQUE");
        }
    },

    "when altering a columns default value" : {
        topic: function () {
            return adapter.alterColumn("myColumn", {original : types.FLOAT({allowNull : false, unique : true, size : 10, "default" : 10, autoIncrement : true, unsigned : true}), "default" : 12});
        },

        'we get ': function (topic) {
            assert.equal(topic, "MODIFY COLUMN myColumn FLOAT(10) UNSIGNED NOT NULL AUTO_INCREMENT DEFAULT 12 UNIQUE");
        }
    }


});


suite.export(module);
