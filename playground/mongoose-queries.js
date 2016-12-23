/**
 * Created by william.reilly on 12/22/16.
 */
const { ObjectID } = require('mongodb');
const { mongoose } = require('./../server/db/mongoose');
const { Todo } = require('./../server/models/todo');
const { User } = require('./../server/models/user');

// An id for one of our todos:  585c1cfa70e54481cb7de9fd
var id = '585c1cfa70e54481cb7de9fd';
// var id = '585c1cfa70e54481cb7de9f811111'; // <<< NOT AN ID


if (!ObjectID.isValid(id)) {
    console.log('Your ID is not valid, solly');
};

if (!ObjectID.isValid(idUser)) {
    console.log('That User ID is not valid, solly');
};

// MONGOOSE already converts your STRING to an ObjectId, for you.
// Veddy nice.
Todo.find({
    _id: id
}).then((todos) => { // <<<<<< RETURNS ARRAY OF DOC(S)
    console.log('Here ya go! SOME, MAYBE', todos);
});

Todo.findOne({
    _id: id
}).then((todo) => { // <<<<<<< RETURNS ONE DOC
    console.log('Here ya go! 1', todo);

});

Todo.findById(id).then((todo) => {
    if(!todo)
{
    return console.log('Id not even found, man!');
}

    console.log('Todo By Id tout court', todo);
}).catch((err) => console.log(err));

// CHALLENGE /////////////////

User.findById(idUser).then((user) => {
    if(!user) {
        return console.log('Huh. Good Id, but no User found. Hmm', idUser);
}
console.log('Way to go. User is : ', user);
}, (err) => {
    console.log('Damn. Just broke man. err: ', err);
});

/*
 $ node playground/mongoose-queries.js
...
Way to go. User is :  { _id: 585acbc18c7698557710e0b5,
 email: 'william@reilly2001.info',
 __v: 0 }

 */