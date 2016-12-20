/**
 * Created by william.reilly on 12/20/16.
 */

const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server', err);
    }
    console.log('Connected :o) to MongoDB server');


    /*
  _id:  new ObjectID('');
     */

    // FETCH!
// RETURNS CURSOR. POINTER to all those documents
// toArray returns a PROMISE!
/*
db.collection('Todos').find({_id:  new ObjectID('58592145cd45b717113fdfd3')}/!*{completed: false}*!/).toArray().then((docs) => {
  console.log('Todos (Not Yet Completed) here!');
  console.log(JSON.stringify(docs, undefined, 2));
}, (err) => {
console.log('Unable to fetch todos :o(', err);
});
*/

// YE OLDE REGEX: https://docs.mongodb.com/manual/reference/operator/query/regex/
/*
 > db.Users.find({},{name:1, _id:0})
 { "name" : "Willem Flusser" }
 { "name" : "Wilhelm Helmut" }
 { "name" : "Wilhelm Helmut" }
 { "name" : "William Wordsworth" }
 { "name" : "William Hazlitt" }
 */
// db.collection('Users').find({name: /Wilhelm/}).toArray().then((docs) => {
// db.collection('Users').find({name: /Wil*.m/}).toArray().then((docs) => { // Everybody: Wilhelm, Williams, Willem
    db.collection('Users').find({name: /Will*.m/}).toArray().then((docs) => { // Willem F., the two Williams
//     db.collection('Users').find({name: /Will.m/}).toArray().then((docs) => {   // Willem Flusser
    console.log('Users here!');
console.log(JSON.stringify(docs, undefined, 2));
}, (err) => {
    console.log('Unable to fetch Users :o(', err);
});


// db.close();
});