/**
 * Created by william.reilly on 12/21/16.
 */

const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

/*
{
    email: "andrew@example.com",
    password: 'myPass123',  // will be BCrypt hashed for store in db
    tokens: [{
        // phone, computer logins ...
    access: 'auth',
    token: 'sadf;ljkasfd;lkj'  // encrypted string
}]
}
*/


// USER MODEL
// e-mail - require, trim, String, min 1

/* TO GET *CUSTOM* MODEL METHODS:
You must create your own Schema using Mongoose Schema.
(As opposed to below where we used more straightforwardly the Mongoose *Model*, to just get a User model, to which we could not attach Custom model methods.
To effect this, we cut & paste the entire object out of mongoose.model() and paste it here in mongoose.Schema. That's it!
*/
var UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true,
        unique: true, // must be unique email!
        /* SAME as below! Not sure I understand *exactly* why short version works oh well.

         validate: {
         validator: (value) => {
         return validator.isEmail(value);
         },
         message: '{VALUE} is not a valid email'
         },
         */
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    }, // /email

    password: {
        type: String,
        require: true,
        minlength: 6 // kinda arbitrary
    },

    tokens: [{
        access: {
            type: String,
            require: true
        },
        token: {
            type: String,
            require: true
        }
    }]

});

// INSTANCE METHOD
/*
!!! ARROW FUNCTIONS - recall - do **NOT** bind a 'this' keyword.
So, we go back to Old School ES5 "function () {}" method style, because the 'this' here needs to reference the Individual Document (the user).
 */

/*
OVERRIDE default toJSON for our User Model:
 */
UserSchema.methods.toJSON = function () {
    var user = this;
    var userObject = user.toObject();
    /*
    .toObject taking mongoose variable user
    converts it into a regular object
    where only properties available on the document exist. Hmm.
     */
    // We leave off password, tokens
    return _.pick(userObject, ['_id', 'email']);
}

UserSchema.methods.generateAuthToken = function () {
    // Slam 'this' onto our var 'user' Cheers:
    var user = this;
    var access = 'auth';
    var token = jwt.sign({ _id: user._id.toHexString(), access: access}, 'abc123').toString(); // our SECRET

    // get ARRAY
    user.tokens.push({  // ES5 way
        access: access,
        token: token
    });
    // user.tokens.push({ access, token }); // ES6 way

    /*
    O.K., at this point we have changed/altered the user instance (put the token on it),
    BUT we have not yet saved it.
    That's next:
     */
    /*  LECTURE 90 ~09:09 is the end of all this chat:
    save() returns a promise, so we chain on a then():
     */
/* See next block below for how we did this instead:
    user.save().then( () => {
        return token; // this is the SUCCESS callback function ...
    }).then( (token) => { // "Over in the server.js file we'll grab the token, by tacking on another callback ...  getting the token and responding inside of that (2nd?) callback function ..."

    })
*/
/*
So instead of above, we 'return' the result of the success callback function
as the input to the next then() callback (from over in server.js)
Our promise here returns a value (token) instead of another promise ... ( ? )

 In server.js we'll invoke this custom instance method user.generateAuthToken to add a token and then set it as a header.

 */
    return user.save().then( () => {
        return token; // this is the SUCCESS callback function ...
});
};

// 'User' will become 'users' collection (lowercased, pluralized)
/*
This mongoose.model() used to hold all the details of the schema that were cut out from here and pasted instead above to the mongoose.schema(). Now that schema is passed in here:
 */
var User = mongoose.model('User', UserSchema); // /User

/*
 http://mongoosejs.com/docs/validation.html
 e.g.
 validate: {
 validator: function(v) {
 return /\d{3}-\d{3}-\d{4}/.test(v);
 },
 message: '{VALUE} is not a valid phone number!'
 }, ...


 https://www.npmjs.com/package/validator
 $ npm i validator --save
 node-todo-api@1.0.0 /Users/william.reilly/dev/Node/Udemy-NODE-Complete-Developer-Course-Mead/07MongoMongooseTodoAPI/node-todo-api
 └── validator@6.2.0

 npm WARN node-todo-api@1.0.0 No repository field.
 */

module.exports = { User }; // ES6 fanciness

/*
// //////////

var userMeUp = new User({
    email: '  william@reilly2001.info'
});

userMeUp.save().then((doc) => {
    console.log('woot User woot');
console.log(doc);
}, (err) => {
    console.log('rats User rats');
    console.log(err);
});
*/
/*
 > show collections
 Todos
 Users
 system.indexes
 todos
 users
 > db.users.find()
 { "_id" : ObjectId("585acbc18c7698557710e0b5"), "email" : "william@reilly2001.info", "__v" : 0 }
 */
