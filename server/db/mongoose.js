/**
 * Created by william.reilly on 12/21/16.
 */
var mongoose = require('mongoose');

// Use the (new) native (Node) JavaScript Promise:
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TodoApp');

// ES5 old(er) skool:
// module.exports = {
//     mongoose: mongoose
// };

// ES6 equivalent:
module.exports = { mongoose };
