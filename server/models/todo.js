/**
 * Created by william.reilly on 12/21/16.
 */

var mongoose = require('mongoose');

// MODEL
var Todo = mongoose.model('Todo', {
    text: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    }
    // "createdAt" we can derive from _id
});


module.exports = { Todo }; // ES6 fanciness


// //////////////////////////////
/*
// Creating new instance of Todo
var newTodo = new Todo({
    text: 'Make that breakfast'
});

newTodo.save().then((doc) => {
    console.log("saved todo", doc)
}, (e) => {
    console.log('oops!');
});
*/
