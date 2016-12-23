/**
 * Created by william.reilly on 12/21/16.
 */

var express = require('express');
var bodyParser = require('body-parser');

var { mongoose } = require('./db/mongoose');

var { Todo } = require('./models/todo');
var { User } = require('./models/user');

/* Replaced by above, refactoring.
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TodoApp');
*/



var app = express();

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

// GET /todos/   /todos/1234

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


app.listen(3000, () => {
    console.log('Started express node server on port 3000');
})

// ES5 Set the 'app' variable herein (on right side)
// on to the 'app' key on the module.exports object (on left side)
// module.exports = { app: app };
// ES6 way shortcut:
module.exports = { app };