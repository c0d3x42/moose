var vows = require('vows'),
        assert = require('assert'),
        moose = require("../lib"),
        mysql = moose.adapters.mysql,
        types = mysql.types,
        Table = moose.Table;

var suite = vows.describe("table object");

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
                assert.throws(function() {topic.validate(value[0], value[1])});
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
            assert.throws(function() {topic.validate(val);});

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
                updated : new Date(1999, 10, 10, 10, 10 ,10)
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
}).export(module);

