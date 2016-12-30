/**
 * Created by william.reilly on 12/21/16.
 */

const _ = require('lodash');

const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');

const { ObjectID } = require('mongodb');

const { Todo } = require('./models/todo');
const { User } = require('./models/user');

/* Replaced by above, refactoring.
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TodoApp');
*/



var app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());


// CRUD Create Read Update Delete
// POST /todos
// RESOURCE CREATION
app.post('/todos', (req, res) => {
    console.log(req.body);
    var todo = new Todo({
        text: req.body.text,
        completed: req.body.completed
    });
    todo.save().then((doc) => {
       res.send(doc);
    }, (err) => {
        res.status(400).send(err);
});
});

// GET /todos/

app.get('/todos', (req, res) => {
    Todo.find().then((todos) => {
    // res.send(todos) // ARRAY
    // res.send({todos: todos}) // Put the ARRAY onto an Object = More Flexible Future
res.send({todos}) // ES6 way to Put the ARRAY onto an Object = More Flexible Future
}, (err) => {
    res.status(400).send(err);
});
});
/* No todos, right now:

 $ node server/server.js
 Started express node server on port 3000

POSTMAN
GET  localhost:3000/todos
 {
 "todos": []
 }
 */



// GET /todos/12345
app.get('/todos/:id', (req, res) => {
    // res.send(req.params);
    var id = req.params.id;
    if (!ObjectID.isValid(id)) { // If NOT Valid... (not even an ObjectId)
        console.log('LOG: not even an ObjectId! so-called id: ', id);
        // return res.status(404).send(); // Instructor  Empty Body
        return res.sendStatus(404); // sendStatus preferred ... Though note that using this 'sendStatus()' you cannot then also "send()" again. "Error: Can't set headers after they are sent." okay.
        // 'Not found'
    }

        // findById 1) err 400 send empty body 2) if todo send todo if !todo
Todo.findById(id).then((todoDoc) => {
        if(!todoDoc) {
    res.status(404).send("SEND: That ID not found");
    return console.log("LOG: That ID not found");
}

// res.sendStatus(200).send({body});
// res.status(200).send({wotgotwrit: todoDoc.text});
// res.status(200).send(todoDoc); // gets you the object itself
// res.status(200).send({todoDoc: todoDoc}); // gets you (better) the object, inside another object - more flexible. ES5 style
res.status(200).send({todoDoc}); // Same.  ES6 style
return console.log("LOG: That ID WAS found");
    }, (err) => {
    // res.sendStatus(400).send({body: body});
    // res.status(400).send({wotgotwritnuttin: todoDoc.text});
    res.status(400).send(); // empty body. Do NOT send the err object message to the client. may contain proprietary information.
}); // /THEN
}); // /GET





// DELETE /todos/:id ////////////////////////
/*
 app.delete('/todos/:id', (req, res) => {

 PSEUDO-BOODO:

 // GET THE ID (OFF PARAMS)

 // VALIDATE THE ID --> NOT VALID? RETURN 404

 // REMOVE THE TODO, BY ID

 // SUCCESS HITTING DATABASE PATH:
 // IF NO DOC, SEND 404
 // IF DOC, SEND DOC BACK WITH 200

 // ERROR HITTING DATABASE PATH:
 // 400 WITH EMPTY BODY

 }); // /app.delete
 */
app.delete('/todos/:id', (req, res) => {
    var idThisTime = req.params.id;
// get id
if (!ObjectID.isValid(idThisTime)) {
    // Internal console log = more info:
    console.log("That's it. You didn't pass an ObjectId, so fuggeddaboutid: ", idThisTime);
    // External response to API called = less info:
    // return res.sendStatus(404); // solly!
    return res.status(404).send(); // or this way...
}
// Database time!
Todo.findByIdAndRemove(idThisTime).then((todo) => {
    if(
!todo
)
{ // todo is null
    // Internal console log = more info:
    console.log("Well, it was ObjectId, but no doc by that name: ", idThisTime);
    // External response to API called = less info:
    return res.status(404).send(); // solly! (not .send({}) btw
}
// Got this far, guess you got yosef a doc!:
console.log("Yeppers: and here's the doc you just done snabbered: ", todo);
res.status(200).send({todo: todo}); // ES5 old school way. Or just .send(todo); Better as this object thing though. And ES6? : .send({todo}); But you already knew that. ;)
},
(err) =>
{
    // Internal console log = more info:
    console.log("Something god awful happened with the database. Nice try though: ", idThisTime);
    // External response to API called = less info:
    return res.status(400).send(); // solly!
}); // /then Promise-handling
}); // /app.delete()
// ObjectId("5862da1a73bfc0444c80a8b4")



// /////////////  P A  T  C  H   ///////
app.patch('/todos/:id', (req, res) => {
   var id = req.params.id;
   var body = _.pick(req.body, ['text', 'completed']);

   if(!ObjectID.isValid(id)) {
       // Not even an ObjectId fer chrissakes
       console.log('raah! Not even an ObjectId fer chrissakes');
       return res.status(404).send();
   }

if (_.isBoolean(body.completed) && body.completed) {
       body.completedAt = new Date().getTime(); // JavaScript timestamp = # secs since 1970 Unix epoch. A number.
} else {
       // Not a Boolean. (Or even if it is a Boolean, it is Not True (a.k.a. False))
    body.completed = false;
    body.completedAt = null; // removes value from database
}

// https://docs.mongodb.com/manual/reference/operator/update/inc/

Todo.findByIdAndUpdate(id,
    /* { $set: body },
    *
    * In other words, 'body' is already:
    * {
     text: body.text,   <<< whatever the text is
     completed: body.completed, <<< etc.
     completedAt: body.completedAt
     }
    *
    *
    * */

/* Interesting. I wrote like so: (Also works) */
{ $set:
    {
        text: body.text,
        completed: body.completed,
        completedAt: body.completedAt
    }
 },

 {
     // MongoDB: false here gets you the updated doc, not the original doc
       // returnOriginal: false
     // Mongoose: true here gets you the updated ("new") doc, not the original doc
     new: true
   }).then((todo) => {
       if(!todo) {
           return res.status(404).send();
}
       console.log(todo);
       res.status(200).send({todo: todo});
}).catch((err) => {
       res.status(400).send();
});

});



// app.listen(3000, () => {
    app.listen(port, () => {
    console.log(`Started express node server on port ${port} `);
})

// ES5 Set the 'app' variable herein (on right side)
// on to the 'app' key on the module.exports object (on left side)
// module.exports = { app: app };
// ES6 way shortcut:
module.exports = { app };