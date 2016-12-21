/**
 * Created by william.reilly on 12/21/16.
 */

var mongoose = require('mongoose');


// USER MODEL
// e-mail - require, trim, String, min 1

// 'User' will become 'users' collection (lowercased, pluralized)
var User = mongoose.model('User', {
    email: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    }
});

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
