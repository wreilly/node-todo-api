/**
 * Created by william.reilly on 12/21/16.
 */
var mongoose = require('mongoose');

// Use the (new) native (Node) JavaScript Promise:
mongoose.Promise = global.Promise;

/*
 Up at Heroku (our "Production"), on ENV will be this config variable:

 MONGODB_URI: mongodb://heroku_j5vczb1f:4hst1ck0k8vp2ikt9ub4gjk451@ds145208.mlab.com:45208/heroku_j5vczb1f
 */
// mongoose.connect('mongodb://localhost:27017/TodoApp');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TodoApp');



// ES5 old(er) skool:
// module.exports = {
//     mongoose: mongoose
// };

// ES6 equivalent:
module.exports = { mongoose };
