/**
 * Created by william.reilly on 1/3/17.
 */

const { ObjectID } = require('mongodb');
const { Todo } = require('../../models/todo');
const { User } = require('../../models/user');

const jwt = require('jsonwebtoken');

//  ///////////////////   USERS   //////////
// one with Auth token, one withOUT


// We make the user's ID outside the array so we can reference it in there:
const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const users = [{
    // _id: new ObjectID(),
    _id: userOneId,
    email: 'joe@example.com',
    password: 'userOnePass',
    tokens: [{
        access: 'auth',
        // token: jwt.sign( { _id: userOneId.toHexString(), access: 'auth' }, 'abc123').toString()
        token: jwt.sign( { _id: userOneId, access: 'auth' }, 'abc123').toString() // Apparently not needed that ol' toHexString biz. "whatever"
    }]
},
    {
        _id: userTwoId,
        email: 'joe222@example.com',
        password: 'userTwoPass',
        tokens: [
            {
                access: 'auth',
                token: jwt.sign({ _id: userTwoId, access: 'auth' }, 'abc123').toString()
            }
        ]
    }];

const populateUsers = (done) => {
    // Deletes ALL items:
    User.remove({}).then(
        () => {
        /*
         By using .save() here on the User model, instead of just "insertMany" as we did on Todos,
         we get our user logic of hashing the password. "insertMany" would have skipped that.
         */
        var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    // Promise.all awaits all the promises you specify in the array:
/* LECTURE 93  ~11:19
Huh. Interesting. Instead of chaining the .then() right here to the Promise.all,
        we instead (see further below) 'return' that Promise.all,
        such that we instead can continue the ongoing chain here, by chaining
         a .then() further below:

    Promise.all([userOne, userTwo]).then(() = > {
        done();
})
*/

    return Promise.all([userOne, userTwo])
}) // /remove({}).then()
    .then(() => {
        done();
    })
}; // populateUsers




//  TODOS /////////////////

/*
 Because our testing includes ObjectIds - we need to explicitly create them here in our sort of dummied up test data (rather than let them be created dynamically by MongoDB etc. ...)
 Hmm.
 */
const todos = [
    {
        _id: new ObjectID(),
        text: 'Seeded Test todo 01',
        _creator: userOneId
    },
    {
        _id: new ObjectID(),
        text: 'Seeded Test todo 02',
        completed: true,
        completedAt: 2000,
        _creator: userOneId
    },
    {
        _id: new ObjectID(),
        text: 'Seeded Test todo 03',
        completed: true,
        completedAt: 3000,
        _creator: userTwoId
    },
    {
        _id: new ObjectID(),
        text: 'Seeded Test todo 04',
        _creator: userTwoId
    }
];

const populateTodos = (done) => {
    Todo.remove({}).then(
        () => { // Deletes ALL items
        return Todo.insertMany(todos);
}).then(
        () => done()
); // fire off done here
};

// the todos array is used over in server.test.js ...
module.exports = { todos, populateTodos, users, populateUsers }

