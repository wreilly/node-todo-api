/**
 * Created by william.reilly on 12/21/16.
 */

const mongoose = require('mongoose');
const validator = require('validator');

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

// 'User' will become 'users' collection (lowercased, pluralized)
var User = mongoose.model('User', {
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

}); // /User

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
