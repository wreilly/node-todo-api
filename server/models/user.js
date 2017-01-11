/**
 * Created by william.reilly on 12/21/16.
 */

const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

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

// INSTANCE METHOD   - UserSchema.methods
// MODEL METHOD      - UserSchema.statics
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
    var tokenWITHHexString = jwt.sign({ _id: user._id.toHexString(), access: access}, 'abc123').toString(); // our SECRET
    var tokenWITHOUTHexString = jwt.sign({ _id: user._id, access: access}, 'abc123').toString(); // our SECRET

    console.log("WR__ 111 tokenWITHHexString: ", tokenWITHHexString);
    console.log("WR__ 222 tokenWITHOUTHexString: ", tokenWITHOUTHexString);

    /*
    Curiouser and curiouser ...

    They're THE SAME:
     WR__ 111 tokenWITHHexString:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ODZjMTBlZWZlZWRlYjBkNDYyNGZmZWEiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNDgzNDc3MjMwfQ.gfS52q3zGLZ0yYurgb4yJsAefQzn2YlfHwflkfpH43o
     WR__ 222 tokenWITHOUTHexString:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ODZjMTBlZWZlZWRlYjBkNDYyNGZmZWEiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNDgzNDc3MjMwfQ.gfS52q3zGLZ0yYurgb4yJsAefQzn2YlfHwflkfpH43o
     */


    // add this token to tokens ARRAY
    user.tokens.push({  // ES5 way
        access: access, // << value is 'auth', recall
        token: token
    });
    // user.tokens.push({ access, token }); // ES6 way

    /*
    O.K., at this point we have changed/altered the user instance object (put the token on it),
    BUT we have not yet saved it to the database.
    That's next:
     */
    /*  LECTURE 90 ~09:09 is the end of all this chat:
   - save() returns a promise, so we chain on a then():
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
    // ** UND VHERE ISN DE FAILUURE CALLBACKENZIES??!
},
    // FAILUURE! (?) <<<<< Hmm. Instructor code does not have this.
    //                 I believe I am on a Wrong Track here.
    //                 Probably benign, never-reached code. C'est la vie.
    (error) => {
        console.log("USER.JS generateAuthToken user.save() FAILUURE: error: ", error);
        return {}; // no token no nothing hmm?
    }
    );
}; // /generateAuthToken()


// //////////////   MODEL METHOD ///////////
// WE NEED ACCESS TO THE 'this' BINDING - so, ES5 function()...
UserSchema.statics.findByToken = function (token) {
    // console.log("WR__ 88 USER.JS findByToken token: ", token);
    var User = this; // MODEL is the 'this' here

    // see also playground/hashing.js
    var decoded; // leave undefined, here. why? jwt.verify() will throw error. we'll use try catch below to deal with that. But/So, I guess I'm inferring, you don't want to DECLARE variables inside a TRY block. Jus' guessin'
    try {
        decoded = jwt.verify(token, 'abc123'); // our Secret will be REMOVED from source code, kids.
        console.log("WR__ 87 USER.JS decoded: ", decoded);

        /*
         WR__ 87 USER.JS decoded:  { _id: '58690d76bb624bb5bdddb230',
         access: 'auth',
         iat: 1483279734 } //  1/1/2017, 9:08:54 AM GMT-5:00
         // http://www.epochconverter.com/

         MONGODB DOCUMENT:
         { "_id" : ObjectId("58690d76bb624bb5bdddb230"), "email" : "roger17@rabbit.com", "password" : "123456", "tokens" : [ { "access" : "auth", "token" : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ODY5MGQ3NmJiNjI0YmI1YmRkZGIyMzAiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNDgzMjc5NzM0fQ.yKj3vrEUtiO1xqABdP6bIFxm1fv4q49aJ5djictQSOA", "_id" : ObjectId("58690d76bb624bb5bdddb231") } ], "__v" : 1 }
         */

    } catch (e) {
        // fails ... return a Promise that will always/only REJECT
        // That takes us back to calling server.js, where we stitch on a .catch() ...
        // N.B. Methinks: Our explicitly sending the 'REJECT' DIFFERS from the whole damned system just hitting an ERROR or otherwise failing to return a 'user' ... hmm
/*
        new Promise((resolve, reject) => {
           reject();
        });
*/
// SHORT version of above:
        return Promise.reject('USER.JS MODEL: my custom error message... jwt.verify fell over, kid');
        // return Promise.reject(); // we'll just send back empty
    }

    // success decoding token:

    // findOne returns a promise. All well and good.
    // So, we, here, do a 'return', babe, to send that back
    //     on over to server.js, which invoked this "findByToken"
    //     and, over there (server.js) we can then stitch on
    //     a 'then()' chain thing-a-ding-a...
    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    });
} // /UserSchema.statics.findByToken()


// FIND BY CREDENTIAL
UserSchema.statics.findByCredentials = function (email, password) {
    console.log("WR__ 666AA findByCredentials email + password passed in: " + email + " : " + password); // Yep.
    var User = this;

    /*
     return User.findOne({email: email}).then((err, user) => {
     if (err) {
     // return res.status(400).send('oops here in findByCredentials we got ERR: ', err);
     return err; // don't do res.send stuff from here!

     }
     */
    return User.findOne({email: email}).then((user) => {

/* ok - yes. let's keep the simpke "if(!user)" test here.
No need to, right here, do the whole "new Promise()" etc.
 */
            if (!user) {

        console.log("WR__ 666XX findByCredentials findOne !user : nuttin' "); // Yep.


        // Hmm. Even though there is a 'return' "above" here,
        //      we still do a 'return' right here.
        // Why? Because right here, we are down inside a chained Promise...
        // from which we do need to 'return' "up". Ca va? Hmm.
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch
        return Promise.reject('USER.JS: findByCredentials: No user found with that e-mail');
    }
 console.log("WR__ 666 findByCredentials user!", user);


    /* ********************
    O.K., we DID find a user ... time to return it, hey?

    Hmm, seems ALL THREE of  these next lines/approaches work. Hmm.
    Maybe # 2 makes most sense here. < Yes, having done the "if(!user) test above, don't need it here (in # 3). Bon.
     */
    // return user; // # 1
    // return Promise.resolve(user); // # 2 <<<<<<<<<
/* # 3: All this biz...
    return new Promise((resolve, reject) => {
        console.log("WR__ 666ZZZ findByCredentials new Promise - user!", user);
            if (!user)
    {
        reject('WR__ 999 new Promise hmm no user ');
    }
    else
    {
        console.log("WR__ 666BB new Promise resolve etc. findByCredentials user!", user);
        resolve(user);
    };
});
    */

    /* ******************** */


    /*
    $$$$$$$$$$  OK - It is PASSWORD BCRYPT TIME $$$$$$$$$$
     https://www.npmjs.com/package/bcrypt#to-check-a-password
    bcrypt.compare(pw, user.hash) true: x resolve  false: y reject
     */
    return new Promise((resolve, reject) => {
        // console.log("WR__ 123a bcrypt world: password: ", password);
    // console.log("WR__ 123b bcrypt world: user: ", user);

        bcrypt.compare(password, user.password).then((response) => {
            // console.log("WR__ 123c bcrypt world: response: ", response);
        if(response) {
            // Promise.resolve(user); // << No.
            // return Promise.resolve(user); // << No.
            resolve(user); // Yep.
        } else {
            // Promise.reject('new Promise bcrypt compare failed'); // << No.
            // return Promise.reject('new Promise bcrypt compare failed'); // << No.
            reject('new Promise bcrypt compare failed'); // Yep.
}
}); // /.then
}); // /new Promise (viz. bcrypt)
}); // /findOne({email})
}; // /findByCredentials(email, password)


UserSchema.pre('save', function (next) {
    var user = this; // bind this once more
    // console.log("WR__ 55 PRE SAVE user: ", user);
    /*
Model method isModified returns T/F re: a property
e.g. a user edit that did not modify pw, don't re-hash that pw value...!
     */
    if ( user.isModified('password') ) {
        // PW WAS modified
        // We will want to *Hash* the plain text pw

        // console.log("WR__ 56 IF Modified True user.password: ", user.password);

        // SALT, HASH on user.password
        bcrypt.genSalt(4, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hashedPassword) => {
            user.password = hashedPassword;
        // console.log("WR__ 56A HASHED? god willing  user.password: ", user.password);
            next();
        });
        });
    } else {
        // PW was NOT modified
        // Don't *Re-Hash* it !!!
        // console.log("WR__ 57 IF Modified False user.password is still: ", user.password);
        // We sort of do nothing, heh-heh, viz. hash biz.
        // But ya still gotta send it back/next/along, mate!
        next();
    }

    // next(); // << Must call at some point in here! (just not here) ;o)
});


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
