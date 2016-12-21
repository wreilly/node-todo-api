/**
 * Created by william.reilly on 12/21/16.
 */

const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server', err);
    }
    console.log('Connected :o) to MongoDB server');

// findOneAndUpdate
// http://mongodb.github.io/node-mongodb-native/2.2/api/Collection.html#findOneAndUpdate
/*
 findOneAndUpdate(filter, update, options, callback)
 Returns promise if no callback is passed. Cool.
 */
/*
 { "_id" : ObjectId("5859996f6595fd3e23dc987b"), "text" : "Robomongo made this guy", "completed" : false }
 Make this TRUE
 */
/*
 MongoDB Update Operators
 https://docs.mongodb.com/manual/reference/operator/update/
 https://docs.mongodb.com/manual/reference/operator/update/set/#up._S_set
 */

/*
db.collection('Todos').findOneAndUpdate({
    text: /Robomongo/
},
    {
        $set: {
            completed: true
        }
    },
    {
        returnOriginal: false
    }).then((result) => {
    console.log(result);
});
*/

/*
 $ node playground/mongodb-update.js
 Connected :o) to MongoDB server
 { lastErrorObject: { updatedExisting: true, n: 1 },
 value:
 { _id: 5859996f6595fd3e23dc987b,
 text: 'Robomongo made this guy',
 completed: true },
 ok: 1 }
 */

// https://docs.mongodb.com/manual/reference/operator/update/inc/
// ////////// CHALLENGE ///////
db.collection('Users').findOneAndUpdate(
    {name: 'Wordsworth'},
    { $set: {
        name: 'Reilly (was Wordsworth, 1812)'
    },
        $inc: {
        year: 1
        }

    },
    { returnOriginal: false }
).then((result) => {
    console.log(result);
});
/*
 $ node playground/mongodb-update.js
 Connected :o) to MongoDB server
 { lastErrorObject: { updatedExisting: true, n: 1 },
 value:
 { _id: 585a7068f4acc6b52be69e0e,
 name: 'Reilly (was Wordsworth, 1812)',
 year: 1813 },
 ok: 1 }
 */

// db.close();

});