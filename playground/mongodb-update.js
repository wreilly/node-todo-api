/**
 * Created by william.reilly on 12/21/16.
 */

const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
    if (err) {
        return console.log('Unable to connect to MongoDB server', err);
    }
    console.log('Connected :o) to MongoDB server');



// db.close();

});