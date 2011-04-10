var vows = require('vows'),
        assert = require('assert'),
        moose = require("../lib"),
        comb = require("comb"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        Table = moose.Table;

var suite = vows.describe("A table object");

suite.addBatch({
    "A table" : {
        topic : new Table("employee", {
            eid :             types.INT({allowNull : false, primaryKey : true, primaryKey : true, autoIncrement : true}),
            firstname :       types.VARCHAR({length : 20, allowNull : false}),
            lastname :        types.VARCHAR({length : 20, allowNull : false}),
            midinitial :      types.CHAR({length : 1}),
            gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
            street :          types.VARCHAR({length : 50, allowNull : false}),
            city :            types.VARCHAR({length : 20, allowNull : false}),
            updated :         types.TIMESTAMP({})
        }),

        "should have properties" : function(topic) {
            topic.type = "mysql";
            var columns = topic.columns;
            var vals = ["eid", "firstname", "lastname", "midinitial", "gender", "street", "city"];
            for (var i in vals) {
                assert.isTrue(topic.isInTable(vals[i]));
            }
        },

        "should validate values" : function(topic) {
            var vals = [
                ["eid", 1],
                ["firstname", "doug"],
                ["lastname", "martin"],
                ["midinitial", null],
                ["gender", "M"],
                ["street", "1 nowhere st."],
                ["city", "NOWHERE"],
                ["updated", new Date()]
            ];
            for (var i in vals) {
                var value = vals[i];
                assert.isTrue(topic.validate(value[0], value[1]));
            }
            vals = [
                ["eid", 1 * 3000000000],
                ["firstname", true],
                ["lastname", false],
                ["midinitial", "AA"],
                ["gender", "Z"],
                ["street", new Date()],
                ["city", new Date()],
                ["updated", false]
            ];
            for (var i in vals) {
                var value = vals[i];
                assert.throws(function() {
                    topic.validate(value[0], value[1]);
                });
            }
        },

        "should validate object" : function(topic) {
            var val = {
                eid : 1,
                firstname : "doug",
                lastname : "martin",
                midinitial : null,
                gender : "M",
                street : "1 nowhere st.",
                city : "NOWHERE",
                updated : new Date()
            };
            assert.isTrue(topic.validate(val));

            val = {
                eid : "1",
                firstname : true,
                lastname : false,
                midinitial : "AA",
                gender : "Z",
                street : new Date(),
                city : new Date(),
                updated : false
            };
            assert.throws(function() {
                topic.validate(val);
            });

        },

        "should convert object" : function(topic) {
            var js = {
                eid : 1,
                firstname : "doug",
                lastname : "martin",
                midinitial : null,
                gender : "M",
                street : "1 nowhere st.",
                city : "NOWHERE",
                updated : new Date(1999, 10, 10, 10, 10, 10)
            };
            var sql = {
                eid : 1,
                firstname : "doug",
                lastname : "martin",
                midinitial : null,
                gender : "M",
                street : "1 nowhere st.",
                city : "NOWHERE",
                updated : "1999-11-10 10:10:10"
            };
            assert.deepEqual(topic.toSql(js), sql);
            assert.deepEqual(topic.fromSql(sql), js);

        }
    }
});


suite.addBatch({
    "when creating a table without a primary key" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50) NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL);");
        }
    },

    "when creating a table with a primary key" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50) NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, PRIMARY KEY (id));");
        }
    },

    "when creating a table with a unique constraint key" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.unique("firstname");
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50) NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, PRIMARY KEY (id), UNIQUE (firstname));");
        }
    },

    "when creating a table with foreign key" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.foreignKey({city : {cities : "name"}});
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50) NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, PRIMARY KEY (id), FOREIGN KEY (city) REFERENCES cities (name));");
        }
    },

    "when creating a table with multiple foreign keys " : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.unique(["firstname", "lastname"]);
            emp.foreignKey({city : {cities : "name"}});
            emp.foreignKey({street : {streets : "name"}});
            emp.foreignKey(["city", "street"], {cities : ["name", "street"]});
            emp.foreignKey({city : {cities : "name"}, street : {streets : "name"}});
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) NOT NULL," +
                    "lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50)" +
                    " NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, PRIMARY KEY (id), FOREIGN KEY (city) REFERENCES " +
                    "cities (name),FOREIGN KEY (street) REFERENCES streets (name),CONSTRAINT fk_cityStreet FOREIGN KEY (city,street)" +
                    " REFERENCES cities (name,street),FOREIGN KEY (city) REFERENCES cities (name),FOREIGN KEY (street) REFERENCES " +
                    "streets (name), CONSTRAINT uc_firstnameLastname UNIQUE (firstname,lastname));");
        }
    },

    "when creating a table with multiple unique keys" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.unique(["firstname", "lastname"]);
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20)" +
                    " NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50)" +
                    " NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, PRIMARY KEY (id), " +
                    "CONSTRAINT uc_firstnameLastname UNIQUE (firstname,lastname));");
        }
    },

    "when creating a table with a composite primary key" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      ["id", "firstname", "lastname"]
            });
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) " +
                    "NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50)" +
                    " NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, " +
                    "CONSTRAINT pk_idFirstnameLastname PRIMARY KEY (id,firstname,lastname));");
        }
    },

    "when creating a table with a array of one for a primary key" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      ["id"]
            });
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50) NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, PRIMARY KEY (id));");
        }
    },

    "when creating a table with a array of one for a unique constraint" : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      ["id"]
            });
            emp.unique(["firstname"]);
            return emp;
        },

        " it should have proper create table syntax " : function(topic) {
            assert.equal(topic.createTableSql, "CREATE TABLE employee(id INT SIGNED NOT NULL AUTO_INCREMENT,firstname VARCHAR(20) NOT NULL,lastname VARCHAR(20) NOT NULL,midinitial CHAR(1) NULL,gender ENUM('M','F') NOT NULL,street VARCHAR(50) NOT NULL,city VARCHAR(20) NOT NULL,updated TIMESTAMP NOT NULL, PRIMARY KEY (id), UNIQUE (firstname));");
        }
    }
});

suite.addBatch({
    "when creating a table " : {
        topic : function() {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            return emp;
        },

        " it should have proper drop table syntax " : function(topic) {
            assert.equal(topic.dropTableSql, "DROP TABLE IF EXISTS employee");
        }
    }
});
//the following is not how you woult typically
//use a table but tests the proper flow
suite.addBatch({

    "When a table has a column renamed" : {

        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            emp.renameColumn("firstname", "firstName");
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee CHANGE COLUMN firstname firstName VARCHAR(20) NOT NULL;");
        }
    },

    "When a table has multiple columns renamed" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            emp.renameColumn("firstname", "firstName");
            emp.renameColumn("lastname", "lastName");
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee CHANGE COLUMN firstname firstName VARCHAR(20) NOT NULL,CHANGE COLUMN lastname lastName VARCHAR(20) NOT NULL;");
        }
    },

    "When a table has a column added" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            emp.addColumn("anotherColumn", types.STRING());
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee ADD COLUMN anotherColumn VARCHAR(255);");
        }
    },

    "When a table has a column added" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                anotherColumn :   types.STRING()
            });
            emp.dropColumn("anotherColumn");
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee DROP COLUMN anotherColumn;");
        }
    },

    "When a table has a default added to a column" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            emp.setColumnDefault("city", "testCity");
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee MODIFY COLUMN city VARCHAR(20) NOT NULL DEFAULT 'testCity';");
        }
    },

    "When a table has a new type set for a column" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            emp.setColumnType("city", types.LONGTEXT());
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee MODIFY COLUMN city LONGTEXT NULL;");
        }
    },

    "When a table has a new allow null set on a column" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false, autoIncrement : true}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP()
            });
            emp.setAllowNull("city", true);
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee MODIFY COLUMN city VARCHAR(20) NULL;");
        }
    },

    "When a table has a primary key added" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.addPrimaryKey("city");
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee DROP PRIMARY KEY , ADD PRIMARY KEY (city);");
        }
    },

    "When a table has a composite primary key added" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.addPrimaryKey(["city", "id"]);
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee DROP PRIMARY KEY , ADD CONSTRAINT pk_cityId PRIMARY KEY (city,id);");
        }
    },

    "When a table has a primary key dropped" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.dropPrimaryKey();
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee DROP PRIMARY KEY;");
        }
    },

    "When a table has foreign keys added" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.addForeignKey(["city", "street"], {cities : ["name", "street"]});
            emp.addForeignKey({city : {cities : "name"}, street : {streets : "name"}});
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee ADD CONSTRAINT fk_cityStreet FOREIGN KEY (city,street) REFERENCES cities (name,street),ADD FOREIGN KEY (city) REFERENCES cities (name),ADD FOREIGN KEY (street) REFERENCES streets (name);");
        }
    },

    "When a table has foreign keys dropped" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.dropForeignKey(["city", "street"], {cities : ["name", "street"]});
            emp.dropForeignKey({city : {cities : "name"}, street : {streets : "name"}});
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee DROP FOREIGN KEY fk_cityStreet,DROP FOREIGN KEY city,DROP FOREIGN KEY street;");
        }
    },

    "When a table has unique contraint added" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.addUnique(["city", "street"]);
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee ADD CONSTRAINT uc_cityStreet UNIQUE (city,street);");
        }
    },

    "When a table has unique contraint dropped" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.dropUnique(["city", "street"]);
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee DROP INDEX uc_cityStreet;");
        }
    },

    "When a table is renamed" : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.rename("employeeTwo");
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee RENAME employeeTwo;");
        }
    },

    "When a table is renamed and a column is added " : {
        topic : function(topic) {
            var emp = new Table("employee", {
                id :             types.INT({allowNull : false}),
                firstname :       types.VARCHAR({length : 20, allowNull : false}),
                lastname :        types.VARCHAR({length : 20, allowNull : false}),
                midinitial :      types.CHAR({length : 1}),
                gender :          types.ENUM({enums : ["M", "F"], allowNull : false}),
                street :          types.VARCHAR({length : 50, allowNull : false}),
                city :            types.VARCHAR({length : 20, allowNull : false}),
                updated :         types.TIMESTAMP(),
                primaryKey :      "id"
            });
            emp.rename("employeeTwo");
            emp.addColumn("anotherColumn", types.STRING());
            return emp;
        },

        " it should have proper alter table syntax " : function(topic) {
            assert.equal(topic.alterTableSql, "ALTER TABLE employee RENAME employeeTwo , ADD COLUMN anotherColumn VARCHAR(255) NULL;");
        }
    }
});
suite.export(module);

