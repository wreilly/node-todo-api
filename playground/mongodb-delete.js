/**
 * Created by william.reilly on 12/21/16.
 */

const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server', err);
    }
    console.log('Connected :o) to MongoDB server');


// deleteMany
/*
db.collection('Todos').deleteMany({text: 'NEW THINGS TO DO'}).then( (result) => {
   console.log('deleteMany');
   console.log(result);
});
*/


// deleteOne
/*
db.collection('Todos').deleteOne({text: 'NEW THINGS TO DO'}).then( (result) => {
    console.log('deleteOne');
    console.log(result);
});
*/

// findOneAndDelete (returns values)
// https://docs.mongodb.com/v3.4/reference/method/db.collection.findOneAndDelete/
/*
db.collection('Todos').findOneAndDelete({text: 'NEW THINGS TO DO'}, { projection: {text:1}, sort: {_id: 1}}).then((result) => {
    console.log('findOneAndDelete');
    console.log(result);
});
*/
/*
 ===============  SUCCESS
 $ node playground/mongodb-delete.js
 Connected :o) to MongoDB server
 findOneAndDelete
 { lastErrorObject: { n: 1 },
 value: { _id: 585a612dec8c9d406177abd4, text: 'NEW THINGS TO DO' },
 ok: 1 }
 ===========
 */

// /////// CHALLENGE: /////////
/*
db.collection('Users').deleteMany({name: /Wilhelm/}).then((result) => {
    console.log('Challenge Delete Many Wilhelm regex');
    console.log(result);
});
*/
/*
 $ node playground/mongodb-delete.js
 Connected :o) to MongoDB server
 findOneAndDelete
 { lastErrorObject: { n: 1 },
 value: { _id: 585a612ec5f8e84062569f96, text: 'NEW THINGS TO DO' },
 ok: 1 }
 Challenge Delete Many Wilhelm regex
 CommandResult {
 result: { n: 17, ok: 1 },
 */

// /////// CHALLENGE # 2 ////////
// { "_id" : ObjectId("5859b2e7eeb3ac33e8eb7c22"), "name" : "William Hazlitt" }
// http://mongodb.github.io/node-mongodb-native/2.2/api/ObjectID.html  ObjectID.createFromHexString()
// OR:
// {_id: new ObjectID('5859b2e7eeb3ac33e8eb7c22')}
db.collection('Users').findOneAndDelete({_id: ObjectID.createFromHexString('5859b2e7eeb3ac33e8eb7c22')}).then((result) => {
    console.log('Challenge # 2 findOneAndDelete Wm. Hazlitt by _id');
    console.log(JSON.stringify(result, undefined, 2));
});

// db.close();

});