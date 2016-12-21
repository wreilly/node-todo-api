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

app.listen(3000, () => {
    console.log('Started express node server on port 3000');
})