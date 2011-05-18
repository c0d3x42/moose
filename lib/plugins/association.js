var associations = require("../associations"),
        oneToMany = associations.oneToMany,
        manyToOne = associations.manyToOne,
        oneToOne = associations.oneToOne,
        manyToMany = associations.manyToMany,
        fetch = associations.fetch,
        comb = require("comb");

/**
 * @class
 *  <p>plugin to expose association capability.</p>
 *
 * The associations exposed include
 *
 *
 *
 *
 * <ul>
 *     <li>oneToMany - Foreign key in associated model's table points to this
 *         model's primary key.   Each current model object can be associated with
 *         more than one associated model objects.  Each associated model object
 *         can be associated with only one current model object.</li>
 *     <li>manyToOne - Foreign key in current model's table points to
 *         associated model's primary key.  Each associated model object can
 *         be associated with more than one current model objects.  Each current
 *         model object can be associated with only one associated model object.</li>
 *     <li>oneToOne - Similar to one_to_many in terms of foreign keys, but
 *         only one object is associated to the current object through the
 *         association.  The methods created are similar to many_to_one, except
 *         that the one_to_one setter method saves the passed object./li>
 *     <li>manyToMany - A join table is used that has a foreign key that points
 *         to this model's primary key and a foreign key that points to the
 *          associated model's primary key.  Each current model object can be
 *         associated with many associated model objects, and each associated
 *         model object can be associated with many current model objects./li>
 * </ul>
 *
 * @name AssociationPlugin
 * @memberOf moose.plugins
 *
 */
exports.AssociationPlugin = comb.define(null, {
    static : {
    /**@lends moose.plugins.AssociationPlugin*/

        /**
         * One of the most common forms of associtaions. One to Many is the inverse of Many to one. One to Many often describes a parent child reationship,
         * where the One To many Model is the parent, and the many to one model is the child.
         * <p>For example consider a BiologicalFather and his children. The father can have many children, but a child can have only one Biological Father.</p>
         *
         * @example
         * biological_father       child
         * -------------_          -------------------------
         * |id  | name  |          |id | bioFatherId  | name |
         * --------------          -------------------------
         * | 1  | Fred  |          | 1 |     1        | Bobby |
         * | 2  | Ben   |  ------> | 2 |     1        | Alice |
         * | 3  | Bob   |          | 3 |     1        | Susan |
         * | 4  | Scott |          | 4 |     4        | Brad  |
         * --------------          -------------------------
         *
         * @example
         *
         * //define Social security model
         * var BioFather = moose.addModel("biological_father");
         *
         * //define Person  model
         * var Child = moose.addModel("child");
         *
         * //Create oneToMany relationship from father to child
         * BioFather.oneToMany("children", {
         *                                  model : Child.tableName,
         *                                  key : {id : "bioFatherId"}
         *                     });
         *
         *
         * //Create oneToOne relation ship from ssn to person with a fetchtype of eager.
         * Child.manyToOne("biologicalFather", {
         *                                  model : BioFather.tableName,
         *                                  fetchType : BioFather.fetchType.EAGER,
         *                                  key : {bioFatherId : "id"}
         *                });
         *
         * Child.findById(1).then(function(child){
         *     child.father.name => "fred"
         * });
         *
         * BioFather.findById(1).then(function(father){
         *     father.children.then(function(children){
         *         children.length => 3
         *     });
         * });
         *
         * </p>
         * @param {String} name the alias of the association. The key you provide here is how the association
         *                      will be looked up on instances of this model.
         * @param {Object} options object that describes the association.
         * @param {String} options.model the table name of the model that this Model is associated with.
         * @param {Function} options.filter Custom filter to define a custom association.
         *                  The filter is called in the scope of model that the association is added to.
         *                  Say we have a model called BioFather that is a one to many to a model called Child.
         * <pre class="code">
         * BioFather.oneToMany("children", {
         *                   model : Child.tableName,
         *                   fetchType : BioFather.fetchType.EAGER,
         *                   filter : function(){
         *                       return  Child.filter({bioFatherId : this.id});
         *                   }
         *                });
         * @param {AssociationPlugin.fetchType.EAGER|AssociationPlugin.fetchType.EAGER} [options.fetchType=AssociationPlugin.fetchType.LAZY]
         *          how fetch the association, if specified to lazy then the association is lazy loaded.
         *          Otherwise the association is loaded when the model is loaded.
         * @param {Object} key this defines the foreign key relationship
         *  <pre class="code">
         *      {thisModelsKey : otherModelsKey}
         *  </pre>
         * @param {String|Object} [options.orderBy] column or columns to order the associated model by.
         */
        oneToMany : function(name, options) {
            var assoc = new oneToMany(options, this.moose);
            assoc.inject(this, name);
        },

        /**
         * See {@link AssociationPlugin.oneToMany}
         * @param {String} name the alias of the association. The key you provide here is how the association
         *                      will be looked up on instances of this model.
         * @param {Object} options object that describes the association.
         * @param {String} options.model the table name of the model that this Model is associated with.
         * @param {Function} options.filter Custom filter to define a custom association.
         *                  The filter is called in the scope of model that the association is added to.
         *                  Say we have a model called Child that is a many to one to a model called BioFather.
         * <pre class="code">
         * Child.manyToOne("biologicalFather", {
         *                   model : BioFather.tableName,
         *                   fetchType : BioFather.fetchType.EAGER,
         *                   filter : function(){
         *                       return  BioFather.filter({id : this.bidFatherId});
         *                   }
         *                });
         *
         * @param {AssociationPlugin.fetchType.EAGER|AssociationPlugin.fetchType.EAGER} [options.fetchType=AssociationPlugin.fetchType.LAZY]
         *          how fetch the association, if specified to lazy then the association is lazy loaded.
         *          Otherwise the association is loaded when the model is loaded.
         * @param {Object} key this defines the foreign key relationship
         * @param {String|Array} [options.orderBy] column or columns to order the associated model by.
         *  <pre class="code">
         *      {thisModelsKey : otherModelsKey}
         *  </pre>
         * @param {String|Object} [options.orderBy] column or columns to order the associated model by.
         */
        manyToOne : function(name, options) {
            var assoc = new manyToOne(options, this.moose);
            assoc.inject(this, name);
        },

        /**
         * <p>Simplest form of association. This describes where there is a one to one relationship between classes.</p>
         *
         * When createing a reciprocal one to one relationship between models one of the models should be a many to one association.
         * The table that contains the foreign key should contain have the manyToOne relationship.
         *
         * <p>For example consider social security numbers. There is one social security per person, this would be considered a one to one relationship.
         *
         * @example
         *          Person                  SSN NUMBER
         *-------------------------         ---------------
         *|id         | ssn       |         |id          |
         *-------------------------         ---------------
         *|00000001   | 111111111 |         | 111111111  |
         *| ......... | ......... | ------> | .........  |
         *| ......... | ......... |         | .........  |
         *| nnnnnnnnn | nnnnnnnn  |         | nnnnnnnnn  |
         *-------------------------         ---------------
         *
         * @example
         *
         * //define Social security model
         * var SocialSecurityNumber = moose.addModel("ssn");
         *
         * //define Person  model
         * var Person = moose.addModel("person");
         *
         * //Create oneToOne relation ship from ssn to person with a fetchtype of eager.
         * SocialSecurityNumber.oneToOne("person", {
         *                                  model : Person.tableName,
         *                                  fetchType : SocialSecurityNumber.fetchType.EAGER,
         *                                  key : {id : "ssn"}
         *                              });
         *
         * //Create oneToMany relation ship from person to ssn,
         * //It is many to one because is contains the ssn foreign key.
         *
         * Person.manyToOne("ssn", {
         *                          model : SocialSecurityNumber.tableName,
         *                          key : {ssn : "id"}
         *                 });
         *
         *

         *
         * Person.findById(1).then(function(person){
         *    person.ssn.then(function(ssn){
         *       ssn.id => 111111111
         *    });
         * });
         *
         * SocialSecurityNumber.findById(111111111).then(function(ssn){
         *    ssn.person.id => 1
         * });
         * </p>
         * @param {String} name the alias of the association. The key you provide here is how the association
         *                      will be looked up on instances of this model.
         * @param {Object} options object that describes the association.
         * @param {String} options.model the table name of the model that this Model is associated with.
         * @param {Function} options.filter Custom filter to define a custom association.
         *                  The filter is called in the scope of model that the association is added to.
         *                  Say we have the same models as defined above.
         * <pre class="code">
         *  SocialSecurityNumber.oneToOne("person", {
         *      model : Person.tableName,
         *      filter : function(){
         *          //find the worker that has my id.
         *          return Person.filter({ssn : this.id});
         *      }
         * });
         * </pre>
         * @param {AssociationPlugin.fetchType.EAGER|AssociationPlugin.fetchType.EAGER} [options.fetchType=AssociationPlugin.fetchType.LAZY]
         *          how fetch the association, if specified to lazy then the association is lazy loaded.
         *          Otherwise the association is loaded when the model is loaded.
         * @param {Object} key this defines the foreign key relationship
         *  <pre class="code">
         *      {thisModelsKey : otherModelsKey}
         *  </pre>
         * @param {String|Object} [options.orderBy] column or columns to order the associated model by.
         */
        oneToOne : function(name, options) {
            var assoc = new oneToOne(options, this.moose);
            assoc.inject(this, name);
        },

        /**
         * The manyToMany association allows a model to be associated to many other rows in another model.
         * and the associated model can be associated with many rows in this model. This is done by
         * using a join table to associate the two models.
         * <p>For example consider phone numbers. Each person can have multiple phone numbers.
         *
         * @example
         * phone          person_phone                   person
         * ------         ----------------------         -----
         * |id  |         |person_id | phone_id|         |id |
         * ------         ----------------------         -----
         * | 1  |         |        1 |       1 |         | 1 |
         * | .  | <------ |        1 |       2 | ------> | 2 |
         * | .  |         |        2 |       2 |         | 3 |
         * | n  |         |        2 |       1 |         | 4 |
         * ------         ----------------------         -----
         *
         * @example
         *
         * //define the PhoneNumber model
         * var PhoneNumber = moose.addModel("phone");
         *
         * //define Person model
         * var Person = moose.addModel("person");
         *
         * //Create manyToMany relationship from person to PhoneNumber
         * Person.manyToMany("phoneNumbers", {
         *                      model : PhoneNumber.tableName,
         *                      joinTable : "person_phone",
         *                      key : {person_id : "phone_id"}
         *});
         *
         *
         * PhoneNumber.manyToMany("owners", {
         *                      model : Person.tableName,
         *                      joinTable : "person_phone",
         *                      key : {phone_id : "person_id"}
         *});
         *
         * Person.findById(1).then(function(person){
         *    person.phoneNumbers.then(function(numbers){
         *       numbers.length => 2
         *    });
         * });
         *
         * PhoneNumber.findById(1).then(function(number){
         *    number.owners.then(function(owners){
         *        owners.length => 2;
         *    });
         * });
         * </p>
         * @param {String} name the alias of the association. The key you provide here is how the association
         *                      will be looked up on instances of this model.
         * @param {Object} options object that describes the association.
         * @param {String} options.model the table name of the model that this Model is associated with.
         * @param {String} options.joinTable the name of the joining table.
         * @param {Function} options.filter Custom filter to define a custom association.
         *                  The filter is called in the scope of model that the association is added to.
         *                  Say we have the same models as defined above.
         * <pre class="code">
         * //Define the join table model so we can query it.
         * PersonPhone = moose.addModel(person_phone);
         * PhoneNumber.manyToMany("owners", {
         *                      model : Person.tableName,
         *                      joinTable : "person_phone",
         *                      filter : function(){
         *                              //find all the person ids
         *                            var jd = PhoneNumber.dataset
         *                                                .select('person_id')
         *                                                .find({phone_id : this.id});
         *                            //now query person with the ids!
         *                            return Person.filter({id : {"in" : jd}});
         *                      }
         *  });
         * </pre>
         * @param {AssociationPlugin.fetchType.EAGER|AssociationPlugin.fetchType.EAGER} [options.fetchType=AssociationPlugin.fetchType.LAZY]
         *          how fetch the association, if specified to lazy then the association is lazy loaded.
         *          Otherwise the association is loaded when the model is loaded.
         * @param {Object} key this defines the foreign key relationship
         *  <pre class="code">
         *      {thisModelsKey : otherModelsKey}
         *  </pre>
         * @param {String|Object} [options.orderBy] column or columns to order the associated model by.
         */
        manyToMany : function(name, options) {
            var assoc = new manyToMany(options, this.moose);
            assoc.inject(this, name);
        },

        /**
         * @borrows _Association.fetch as fetch
         */
        fetchType : fetch
    }});