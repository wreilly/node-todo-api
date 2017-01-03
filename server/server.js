/**
 * Created by william.reilly on 12/21/16.
 */

// Refactored out of here (/server/server.js) to this new /server/config/config.js :
require('./config/config');

const _ = require('lodash');

const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
/* Replaced by above, refactoring.
 var mongoose = require('mongoose');
 mongoose.Promise = global.Promise;
 mongoose.connect('mongodb://localhost:27017/TodoApp');
 */

const { ObjectID } = require('mongodb');

const { Todo } = require('./models/todo');
const { User } = require('./models/user');

var { authenticate } = require('./middleware/authenticate');



var app = express();
// const port = process.env.PORT || 3000;
const port = process.env.PORT; // ENV now handled above

app.use(bodyParser.json());

// *************************************
//  *****     TODOS     ****************
// *************************************

// CRUD Create Read Update Delete

// POST /todos
app.post('/todos', (req, res) => {
    console.log("WR__ POST /todos 01 req.body", req.body);
    var todo = new Todo({
        text: req.body.text,
        completed: req.body.completed
    });
    console.log("POST /todos 02 WR__ NEW TODO! ", todo);
    todo.save().then((doc) => {
       res.send(doc);
    }, (err) => {
        res.status(400).send(err);
});
});

// GET /todos/

app.get('/todos', (req, res) => {
    console.log("WR__ 97 wtf app.get /todos"); // yep.
    Todo.find().then((todos) => {
    // res.send(todos) // ARRAY
    // res.send({todos: todos}) // Put the ARRAY onto an Object = More Flexible Future
res.send({todos}) // ES6 way to Put the ARRAY onto an Object = More Flexible Future
}, (err) => {
    res.status(400).send(err);
});
});
/* No todos, right now:

 $ node server/server.js
 Started express node server on port 3000

POSTMAN
GET  localhost:3000/todos
 {
 "todos": []
 }
 */



// GET /todos/12345
app.get('/todos/:id', (req, res) => {
    // res.send(req.params);
    var id = req.params.id;
    if (!ObjectID.isValid(id)) { // If NOT Valid... (not even an ObjectId)
        console.log('LOG: not even an ObjectId! so-called id: ', id);
        // return res.status(404).send(); // Instructor  Empty Body
        return res.sendStatus(404); // sendStatus preferred ... Though note that using this 'sendStatus()' you cannot then also "send()" again. "Error: Can't set headers after they are sent." okay.
        // 'Not found'
    }

        // findById 1) err 400 send empty body 2) if todo send todo if !todo
Todo.findById(id).then((todoDoc) => {
        if(!todoDoc) {
    res.status(404).send("SEND: That ID not found");
    return console.log("LOG: That ID not found");
}

// res.sendStatus(200).send({body});
// res.status(200).send({wotgotwrit: todoDoc.text});
// res.status(200).send(todoDoc); // gets you the object itself
// res.status(200).send({todoDoc: todoDoc}); // gets you (better) the object, inside another object - more flexible. ES5 style
res.status(200).send({todoDoc}); // Same.  ES6 style
return console.log("LOG: That ID WAS found");
    }, (err) => {
    // res.sendStatus(400).send({body: body});
    // res.status(400).send({wotgotwritnuttin: todoDoc.text});
    res.status(400).send(); // empty body. Do NOT send the err object message to the client. may contain proprietary information.
}); // /THEN
}); // /GET





// DELETE /todos/:id ////////////////////////
/*
 app.delete('/todos/:id', (req, res) => {

 PSEUDO-BOODO:

 // GET THE ID (OFF PARAMS)

 // VALIDATE THE ID --> NOT VALID? RETURN 404

 // REMOVE THE TODO, BY ID

 // SUCCESS HITTING DATABASE PATH:
 // IF NO DOC, SEND 404
 // IF DOC, SEND DOC BACK WITH 200

 // ERROR HITTING DATABASE PATH:
 // 400 WITH EMPTY BODY

 }); // /app.delete
 */
app.delete('/todos/:id', (req, res) => {
    var idThisTime = req.params.id;
// get id
if (!ObjectID.isValid(idThisTime)) {
    // Internal console log = more info:
    console.log("That's it. You didn't pass an ObjectId, so fuggeddaboutid: ", idThisTime);
    // External response to API called = less info:
    // return res.sendStatus(404); // solly!
    return res.status(404).send(); // or this way...
}
// Database time!
Todo.findByIdAndRemove(idThisTime).then((todo) => {
    if(
!todo
)
{ // todo is null
    // Internal console log = more info:
    console.log("Well, it was ObjectId, but no doc by that name: ", idThisTime);
    // External response to API called = less info:
    return res.status(404).send(); // solly! (not .send({}) btw
}
// Got this far, guess you got yosef a doc!:
console.log("Yeppers: and here's the doc you just done snabbered: ", todo);
res.status(200).send({todo: todo}); // ES5 old school way. Or just .send(todo); Better as this object thing though. And ES6? : .send({todo}); But you already knew that. ;)
},
(err) =>
{
    // Internal console log = more info:
    console.log("Something god awful happened with the database. Nice try though: ", idThisTime);
    // External response to API called = less info:
    return res.status(400).send(); // solly!
}); // /then Promise-handling
}); // /app.delete()
// ObjectId("5862da1a73bfc0444c80a8b4")



// /////////////  P A  T  C  H   ///////
app.patch('/todos/:id', (req, res) => {
   var id = req.params.id;
   var body = _.pick(req.body, ['text', 'completed']);

   if(!ObjectID.isValid(id)) {
       // Not even an ObjectId fer chrissakes
       console.log('raah! Not even an ObjectId fer chrissakes');
       return res.status(404).send();
   }

if (_.isBoolean(body.completed) && body.completed) {
       body.completedAt = new Date().getTime(); // JavaScript timestamp = # secs since 1970 Unix epoch. A number.
} else {
       // Not a Boolean. (Or even if it is a Boolean, it is Not True (a.k.a. False))
    body.completed = false;
    body.completedAt = null; // removes value from database
}

// https://docs.mongodb.com/manual/reference/operator/update/inc/

Todo.findByIdAndUpdate(id,
    /* { $set: body },
    *
    * In other words, 'body' is already:
    * {
     text: body.text,   <<< whatever the text is
     completed: body.completed, <<< etc.
     completedAt: body.completedAt
     }
    *
    *
    * */

/* Interesting. I wrote like so: (Also works) */
{ $set:
    {
        text: body.text,
        completed: body.completed,
        completedAt: body.completedAt
    }
 },

 {
     // MongoDB: false here gets you the updated doc, not the original doc
       // returnOriginal: false
     // Mongoose: true here gets you the updated ("new") doc, not the original doc
     new: true
   }).then((todo) => {
       if(!todo) {
           return res.status(404).send();
}
       console.log(todo);
       res.status(200).send({todo: todo});
}).catch((err) => {
       res.status(400).send();
});

});



// *************************************
//  *****     USERS     ****************
// *************************************

// POST /users
// Create / Register NEW User. Get their Password in plain text. We'll BCrypt it to DB.
/*
We're to use PICK: e.g. for Todos we had:
 var body = _.pick(req.body, ['text', 'completed']);
 */
/*
POST looks like:
{
 email: wreilly2001@gmail.com,
password: '123456'
}
 */
app.post('/users', (req, res) => {
    console.log("WR__ POST /users req.body: ", req.body);

    // var newUser = new User({ });
// console.log("01 WR__ newUser: ", newUser); // 01 WR__ newUser:  { _id: 5866c0922c2ab686a13d49bd, tokens: [] }
    var newUser = new User(  _.pick(req.body, ['email', 'password']) );

console.log("02 WR__ newUser: ", newUser); // 02 WR__ newUser:  { email: 'wreilly2001@gmail.com', password: '1234567' }


/* CUSTOM:
 MODEL METHODS e.g. User.findByToken
 INSTANCE METHODS e.g. user.generateAuthToken
 */


    newUser.save().then(
        // 1) ok resolved promise happy path:
        // (newUser) => {
         () => { // perhaps surprisingly (perhaps not) we do not need to explicitly put that 'newUser' inside the () here. It 'just works'. Hmm. ...
        console.log("WR__ SERVER.JS 44 new user is: ", newUser);

        /*
        Hmm, *instead* of res.send, we'll do auth token biz:
        "Since we know it returns a ___? , we return it,
        and having done so we now introduce a .then() before the .catch/(err)
         */
        return newUser.generateAuthToken(); // no args

        // http://expressjs.com/es/api.html#res.send
// NO LONGER handled HERE: res.send({user: newUser});
}).then( (token) => {
    // We have USER and we have TOKEN
    /*
    x- custom header, not HTTP strictly speaking
    header() name-value pairs, commma separated:
     */
    res.header('x-auth', token).send( { user: newUser });

})
/*  AIN'T WOIKIN'   (Was able to fix (!) :o)  Below)
My idea, of not using .catch(e) and instead passing a 2nd (error) function to the 'then()' promise, is, I now believe, flawed.
By the time we get here, we are no longer really still back inside that 'then()' promise thing above. Something else has happened in between. We went over to do that generateAuthToken() bit and it 'returned'  a value not a promise (huh?) or something like that, and so now really the better overall ".catch(e)" is your ticket at this point in the code to catch an error. Better than relying on that "2nd passed-in function" to handle the error.
That's what I think. That's what the Instructor code shows. Let's give it a whirl.

// HMM I didn't do .catch(e) here, but, should work I THINK. HMM.
// 2) not ok rejected promise UNhappy path:
(err) => {
            console.log("ERR is ", err);
    res.status(400).send(err); // ??  http://expressjs.com/en/4x/api.html#middleware-callback-function-examples

};
*/
.catch((err) => { // YEP!
    console.log("WR__ NEW USER CATCH ERR is ", err);
res.status(400).send(err);
});



}); // /app.post(/users) (req, res) => {









// //////// LECTURE 91 PRIVATE ROUTES


var authenticate = (req, res, next) => {

    var token = req.header('x-auth');

    User.findByToken(token).then((user) => {
      if(!user) {
        return Promise.reject("AUTHENTICATE REFACTOR: my custom err msg: good token, no user, solly");

    }
// NEW STUFF...
    /* ~14:02
    Instead of just sending back the user as response,
    we will 'modify the request object, such that we can use
    it (the modified request object) in the route down below...
     */
    // res.send(user); // << WAS
    req.user = user; // << NEW
    req.token = token; // << NEW

    next(); // MUST call

}).catch((error) => {
        res.status(401).send(error);
        // Here in catch(error), we do NOT call the next(). just saying.
});
};

/*
*** REFACTORED 'authenticate' out to its own function (above)
 */
app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user); // << With Refactoring, the req object now has the user (and the token)
}); // /GET /users/me


/* *******************
*** OLD authentication code (now refactored out above to 'authenticate()'
 */
/*
app.get('/users/me', (req, res) => {
    console.log("WR__ 98 PRE token from header x-auth: ");


    /!*
    Where (the HELL) is my header for 'x-auth' ??? ???
     *!/
   var token = req.header('x-auth'); // pass in key, get value
var wr__postmanToken = req.header('postman-token');
var wr__userAgent = req.header('user-agent');

console.log("WR__ 99MISERABLE token from header x-auth: ", token);

console.log("WR__ 9THOUSAND6 req.header wr__userAgent, kids!: ", wr__userAgent); // Yes, finally. 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5)...'
console.log("WR__ 9THOUSAND7 req.header postman-token wr__postmanToken, kids!: ", wr__postmanToken); // undefined, from browser request. understandable.
console.log("WR__ 9THOUSAND8 req.headers, kids!: ", req.headers);

/!*
WHOA HARD-CODED!
 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ODY5MGQ3NmJiNjI0YmI1YmRkZGIyMzAiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNDgzMjc5NzM0fQ.yKj3vrEUtiO1xqABdP6bIFxm1fv4q49aJ5djictQSOA
 *!/

// Let's stop hard coding it, shall we? Gracias.
// token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ODY5MGQ3NmJiNjI0YmI1YmRkZGIyMzAiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNDgzMjc5NzM0fQ.yKj3vrEUtiO1xqABdP6bIFxm1fv4q49aJ5djictQSOA';

console.log("WR__ 99 token from header x-auth: ", token);

// User MODEL Custom Method
/!* N.B. We can stitch on a then() here because the findByToken does a 'return' etc. etc. etc.
 *!/
User.findByToken(token).then((user) => {
    if(!user) {
        // return something i guess...
    console.log("WR__ 100 No user ?? etc.");
    /!*
    "Token was valid but for some reason could not find a document/user that matched the parameters specified..."
     *!/
    // So we want to effectively send this same error msg response:
// res.status(401).send();
// But to do that (line above), we can more elegantly etc. do this:
    return Promise.reject("SERVER.JS: my custom err msg: good token, no user, solly");
//     return Promise.reject(); // << or just empty viz. msg
    // That way (line above) we effectively (and actually) simply pass control on down to the .catch(error) below, and we have IT do the "401" send biz.
    }
// happy path...
console.log("WR__ 101 Yay got this user: ", user);
res.send(user);
}).catch((error) => { // << error gets: "My custom error message..."
    // We get here when the called findByToken sends its reject()
    // N.B. Methinks: That differs from the "no user" returned if(!user) above. Not quite sure what causes that to occur... hmm.
    // 401 = Auth Required.
 res.status(401).send(error);
});

}); // /GET /users/me
*/  // OLD authenticated code now refactored out. **************




// app.listen(3000, () => {
    app.listen(port, () => {
    console.log(`Started express node server on port ${port} `);
})

// ES5 Set the 'app' variable herein (on right side)
// on to the 'app' key on the module.exports object (on left side)
// module.exports = { app: app };
// ES6 way shortcut:
module.exports = { app };