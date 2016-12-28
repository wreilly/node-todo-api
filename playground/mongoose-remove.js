/**
 * Created by william.reilly on 12/27/16.
 */
const { ObjectID } = require('mongodb');
const { mongoose } = require('./../server/db/mongoose');
const { Todo } = require('./../server/models/todo');
const { User } = require('./../server/models/user');

/*
if (!ObjectID.isValid(id)) {
    console.log('Your ID is not valid, solly');
};
*/

/*

Todo.findById(id).then((todo) => {
    if(!todo)
{
    return console.log('Id not even found, man!');
}

}).catch((err) => console.log(err));
*/

// Todo.remove({})   MULTIPLE
/*
Todo.remove({}).then((result) => {
   console.log('Killed \'em all!', result);
}, (err) => {
    console.log('We hit an error trying to kill \'em all!', err);
});
*/


// Todo.findOneAndRemove()  ONE. And, get it back!


var idLocal = new ObjectID('58628894031e68f48e447b0e');
var idStringLocal = '5862b43373bfc0444c80a61e';

// Todo.findByIdAndRemove()  ONE. And, get it back!
// Todo.find({_id: ObjectID('58628894031e68f48e447b0e')}).then((todo) => {
    // Todo.findById(idLocal).then((todo) => {
/*
Little Finding;
findByIdAndRemove() works on both:
- an ObjectId
- a String (that is the ObjectId value)
 */
// Todo.findByIdAndRemove(idLocal).then((todo) => {
    Todo.findByIdAndRemove(idStringLocal).then((todo) => {
console.log('found it! and here is its data, even though it is by now G-O-N-E: ', todo);
})
/*
 $ node playground/mongoose-remove.js
 found it! and here is its data, even though it is by now G-O-N-E:  { _id: 58628894031e68f48e447b0e,
 text: 'got to get going',
 completedAt: null,
 completed: false }
 ^C



 > db.todos.find({_id: ObjectId("58628894031e68f48e447b0e")})
 >
 */
