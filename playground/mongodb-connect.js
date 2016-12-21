/**
 * Created by william.reilly on 12/20/16.
 */


// const MongoClient = require('mongodb').MongoClient;
const { MongoClient, ObjectID } = require('mongodb');

/*
ES6 Object Destructuring
var user = { name: 'joe', age: 55 };
var { varName } = user; // pulls off the 'name' from that object, can give new var name (or keep!)
console.log(varName); // 'joe'
 */


var obj = new ObjectID();
console.log(obj); // an instance of one. will be// unique
// e.g. 585992f571ddfd2ed425a87a


// This call establishes which DATABASE: "TodoApp"
MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server', err);
    } // having used return above, no need to use 'else'
    console.log('Connected :o) to MongoDB server');

    /* COLLECTIONS:
    Todos
    Users
     */

    db.collection('Todos').insertOne({text: 'NEW THINGS TO DO', completed: false}, (err, result) => {
        if (err) {
            return console.log("Unable to insert todo", err);
        }
        console.log(JSON.stringify(result, undefined, 2));
/*
 {
 "n": 1,
 "ok": 1
 }
 */
// Same thing: result, result.result.  okay.
console.log(JSON.stringify(result.result, undefined, 2));
        /*
         {
         "n": 1,
         "ok": 1
         }
         */
console.log(JSON.stringify(result.ops, undefined, 2));
/*
 [
 {
 "text": "What needs doing",
 "completed": false,
 "_id": "58592412acc533178def13d2"
 }
 ]
 */

    })


db.collection('Users').insertOne({'name': 'Wilhelm Helmut', 'color': 'fringeorange', 'location': 'Outer Cambridge'},
    (err, result) => {
        if (err) {
            return console.log('Error on Users collection, kids')
        }
        console.log("Hey great, user added");
        console.log(JSON.stringify(result.ops, undefined, 2));
        // *** TIMESTAMP
// 2016-12-20T20:16:19.000Z
// (It is 3:16 local ET)
// $ date -- Tue Dec 20 15:17:06 EST 2016

console.log(result.ops[0]._id.getTimestamp());
});

    db.close();
});