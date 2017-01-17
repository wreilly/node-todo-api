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
const bcrypt = require('bcryptjs');

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
// authenticate gives us: 1) user, 2) token
app.post('/todos', authenticate, (req, res) => {
// app.post('/todos', (req, res) => {
    console.log("WR__ POST /todos 01 req.body", req.body);
    var todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
        // completed: req.body.completed // Not sure why I put this in; Instructor code does not. ok.
    });
    console.log("POST /todos 02 WR__ NEW TODO! ", todo);
    todo.save().then((doc) => {
       res.send(doc);
    }, (err) => {
        res.status(400).send(err);
});
});

// GET /todos/

// app.get('/todos', (req, res) => {
app.get('/todos', authenticate, (req, res) => {
    console.log("WR__ 97 wtf app.get /todos"); // yep.
// Now limiting the find to the (authenticated) user's Todos ...
    Todo.find({_creator: req.user._id}).then((todos) => {
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



// GET /todos/:id
// GET /todos/12345
// app.get('/todos/:id', (req, res) => {
app.get('/todos/:id', authenticate, (req, res) => {
    // res.send(req.params);
    var id = req.params.id;
    if (!ObjectID.isValid(id)) { // If NOT Valid... (because it's not even an ObjectId)
        console.log('LOG: not even an ObjectId! so-called id: ', id);
        // return res.status(404).send(); // Instructor  Empty Body
        return res.sendStatus(404); // sendStatus preferred ... Though note that using this 'sendStatus()' you cannot then also "send()" again. "Error: Can't set headers after they are sent." okay.
        // 'Not found'
    }

        /* findById 1) err 400 send empty body 2) if todo send todo if !todo
         */
/* Hey! With AUTHENTICATION now, we can't allow the API to merely:
1) require a TODO ID
2) require a token (authenticated logged-in user)
That's not enough!
Any logged-in user, if they get or guess a todo ID, would get that data. Not good.
So - improvement: do our FIND on the database based on BOTH.
If you send in a todo id #, fine, but that # must be on a document that also matches YOU as the creator. Cheers.
 */
// Todo.findById(id).then((todoDoc) => {
Todo.findOne({
    _id: id,
    _creator: req.user.id // << Nice. See "Remark" in authenticate.js
}).then((todoDoc) => {
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
// app.delete('/todos/:id', (req, res) => {
app.delete('/todos/:id', authenticate, (req, res) => {
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
/*
With AUTHENTICATION now, we need ensure 2 things not 1:
- Todo ID
- Creator
 */
// Todo.findByIdAndRemove(idThisTime).then((todo) => {
Todo.findOneAndRemove({
    _id: idThisTime,
    _creator: req.user._id
}).then((todo) => {
    if(
!todo
)
{ // todo is null
    // Internal console log = more info:
    console.log("SERVER.JS: DELETE TODO - Well, it was ObjectId, but no doc by that name: ", idThisTime);
    console.log("=========\nInteresting: Here in api logic (server.js), if search fails (use case, right here), the only data we have access to is the passed-in parameter of the _id of the todo. (Presumably, any calling client would know something (?) about the todo _id they had, but... who knows.) \nIn any event, therefore the only data we (API response) can show in any detailed 'Why Not Found' message is just that todo _id (and okay, now with authentication, the user _id too), but these two things are not really v. helpful for real data (you don't have user email, you don't have todo text). Instead, you would have to manually go query database to find out what user, what todo. And this is entirely useless for Mocha testing data (_id dynamically generated each run - no capability to go 'find' it anywhere). Such is life. My best understanding. ('MBU', anyone?)\n=========")
    console.log(`That is, the specified combination of: \n todo._id ${idThisTime} and \n user._id ${req.user._id} \nwas not found`);
    // External response to API called = less info:
    return res.status(404).send(); // solly! (not .send({}) btw
}
// Got this far, guess you got yosef a doc!:
console.log("SERVER.JS Yeppers: and here's the doc you just done snabbered: ", todo);
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



// /////////////  P  A  T  C  H   ///////
/*
AUTHENTICATION NOW.
That means only the owner of the todo can patch it! (of course)
 */
/*
ENHANCEMENT:

As written, user must send BOTH 1) text AND 2) completed T/F.
(Even if they have no update, viz. 1) perhaps, or 2).)

Enhancement: allow user to send 1) OR 2) (or both).

 Three essential Use Cases.
 $$$$$$$$$$$$$$$$$$$$$$$$$$$
 1. RE-WORD
 PATCH TEXT (only)

 2. TOGGLE COMPLETE
 PATCH COMPLETE (only)

 3. TOGGLE COMPLETE & RE-WORD
 PATCH TEXT
 PATCH COMPLETE (both...)
 $$$$$$$$$$$$$$$$$$$$$$$$$$$
 */
app.patch('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
var user = req.user; // < recall, authenticate puts user on req object. nice.

console.log("SERVER.JS: PATCH: req.params.id: TODO ", id);
console.log("SERVER.JS: PATCH: req.params.user.email: USER ", user.email);

var body = _.pick(req.body, ['text', 'completed']);
var myBody = req.body; //, ['text', 'completed']);
// console.log("SERVER.JS: _pick body: ", body);
// console.log("SERVER.JS: _pick 02 typeof(body.completed): ", typeof(body.completed));
console.log("SERVER.JS: from req object: myBody: ", myBody);

/* ******** BIG FINDING **********
From Instructor Code.
- Right here, at top, when you have _.pick'ed the sent parameters (E.g. 'text' if it is sent, and NO 'text' property if it was NOT sent) ...
- ... just use the resulting body or myBody or whatever you want to call it.
- That way, you do NOT need to go CRAZY below trying to test for "Is body.text here, or not, etc."
Only drawback (t'ain't much): if you do update text but do not send 'completed', then Instructor code defaults completed to FALSE. Perhaps a reasonable default.
Even this could be rectified by use of this test (not in Instructor Code; found it On My Own), to see whether completed got sent at all:
         (typeof(body.completed) === 'undefined')
 I am now officially done with all this brou-ha-ha.
 Yeesh.
 Monday, January 16th, 2017 09:58 A.M.
 */


/*  No - doesn't work for us in this scenario. completed is undefined (!)
if(completed in myBody) {
    // https://www.nczonline.net/blog/2010/07/27/determining-if-an-object-property-exists/
    console.log("HOT DAMN NICHOLAS ZAKAS");
}
*/

/* Works. Veddy nice.
// http://davidbcalhoun.com/2011/checking-for-undefined-null-and-empty-variables-in-javascript/
if(typeof(justMadeThisUp) === 'undefined') {
    // https://www.nczonline.net/blog/2010/07/27/determining-if-an-object-property-exists/
    console.log("HOT DAMN DAVID CALHOUN! justMadeThisUp"); // Yeah! works. whoa.
}
*/
/* Works.
if(typeof(body.completed) === 'undefined') {
    // https://www.nczonline.net/blog/2010/07/27/determining-if-an-object-property-exists/
    // WR! N.B. 'undefined' not undefined   Sheesh.
    console.log("HOT DAMN DAVID CALHOUN! body.completed");
}
*/


if (!ObjectID.isValid(id)) {
    // Not even an ObjectId fer chrissakes
    console.log('raah! Not even an ObjectId fer chrissakes');
    return res.status(404).send();
}

var useCase01Flag = false; // RE-WORD only
var useCase02AFlag = false; // TOGGLE COMPLETE only, to TRUE/COMPLETE
var useCase02BFlag = false; // TOGGLE COMPLETE only, to FALSE/NOT-COMPLETE
var useCase03AFlag = false; // RE-WORD & TOGGLE COMPLETE, to TRUE/COMPLETE
var useCase03BFlag = false; // RE-WORD & TOGGLE COMPLETE, to FALSE/NOT-COMPLETE
var useCase99WARNINGFlag = false; // Used for NO text, NO completed sent. See "Warning" below


var mySetVar = {}; // hmm empty obj?
var myUnsetVar = {}; // hmm empty obj?
var myConvenientUndefined = undefined;
// console.log("WR__ typeof(myConvenientUndefined): ", typeof(myConvenientUndefined)); // undefined

// ////////////// BREAKING THIS FIRST IF() ON PURPOSE: "false"
// Why? Because it's Old Thinking, that's why!
if (_.isBoolean(body.completed) && body.completed && false) {
    // req.body.completed === true
    console.log("useCase00 - SERVER.JS: PATCH.  _.isBoolean(body.completed) && body.completed: body.completed: ", body.completed);
    body.completedAt = new Date().getTime(); // JavaScript timestamp = # secs since 1970 Unix epoch. A number.
} else if ((typeof(body.completed) === 'undefined') && body.text) {
    // USE CASE 1. Re-word. (No change to completed)

    // } else if (!body.completed && body.text) { // <<< Nope
    // body.completed === null <<< NOPE.
    // N.B. completed is a Boolean. Just testing with '!' is dangerous.
    // I want to know/assert/test that it is NOT PRESENT.
    // But '!' of course just flips Boolean value (T->F or F->T). Hmm. Washout!

    // SOLUTION (THank you David Calhoun) typeof() !=== undefined. Whew.


    // USE CASE 1. Re-word. (No change to completed)
// They didn't send any completed info. Let's leave that unchanged.
    // That is, no, do not "hard-code" setting it to false. Leave as-is.
    console.log("useCase01 - SERVER.JS: PATCH.  typeof(body.completed) === undefined &&  body.text: ", body.text);
    useCase01Flag = true;
    mySetVar = {
        text: body.text
        //   completed: body.completed,
        // completedAt: body.completedAt
    }

    // Really, this is just N/A:
    myUnsetVar = {
        // no change to this
    }


} else if (!body.text && _.isBoolean(body.completed)) {
    // req.body.text === null
    // USE CASE 2. Toggle Complete. (No change to text)
// They didn't send any text info. Let's leave that unchanged.

    console.log("useCase02 - SERVER.JS: PATCH.  !body.text... body.completed: ", body.completed);

    if (body.completed) {
        useCase02AFlag = true;
    } else {
        useCase02BFlag = true;
    }

    if (body.completed) {
        // User says to set 'completed' to TRUE = Completed!
        // (regardless of what it might have been before ...)
        mySetVar = {
            /*
             O.K. No, don't "emulate" instructor code (sort of).
             That line, for me, wipes out the text property.
             Why ? By the time my code gets here, body.text is ''
             And that ('') is what gets $set onto my record. Not good.
             Instructor code doesn't do it like that.
             Instructor code way up at top of function either _.pick 'text' if it is there to be _.pick'ed. If it isn't there, there is NO "text:" property AT ALL on the $set, so an empty text does NOT wipe out the actual. Hah.
             */
            // text: body.text, // << Nope. TRYING TO EMULATE INSTRUCTOR CODE WHY NOT
            // text: body.text // Leave this commented out, as I had it.<< ORIG (ME)
            completed: body.completed,
            // We put a new date/time on its being marked completed:
            // Q. Can I put JavaScript logic right here like this? Think so...
            completedAt: body.completedAt = new Date().getTime() // ?
        };
    } else {
        // Need to do this as an Assignment (=) on the object first like so, THEN invoke that in the mySetVar object property setting (:) (below) (j'espere)
        // console.log("WR__ 987 body.completedAt: ", body.completedAt); // undefined
        body.completedAt = undefined;
        // console.log("WR__ 654 body.completedAt: ", body.completedAt); // undefined
        try {
            mySetVar = {
                /*
                 O.K. JUST LIKE ABOVE for body.completed === true : No, don't "emulate" instructor code here, either.
                 That line, for me, wipes out the text property.
                 Why ? By the time my code gets here, body.text is ''
                 And that ('') is what gets $set onto my record. Not good.
                 Instructor code doesn't do it like that.
                 Instructor code way up at top of function either _.pick 'text' if it is there to be _.pick'ed. If it isn't there, there is NO "text:" property AT ALL on the $set, so an empty text does NOT wipe out the actual. Hah.
                 */
                // text: body.text, // << Nope. TRYING TO EMULATE INSTRUCTOR CODE WHY NOT
                // text: body.text // Leave this commented out, as I had it.<< ORIG (ME)

                completed: body.completed,
                // completedAt: null // null takes whole property entirely out of MongoDB record
                // HMM ABOVE IS NOT SO: "completedAt" : null, << Hmm, maybe this is Good Enough.
                // Let's try undefined instead
                // http://stackoverflow.com/questions/12636938/set-field-as-empty-for-mongo-object-using-mongoose
// See myUnsetVar instead. Not having success using $set to kill a field. Wish us luck
                // completedAt: body.completedAt // No.: myConvenientUndefined // No: undefined

                // https://docs.mongodb.com/manual/reference/operator/update/unset/
            }
            myUnsetVar = {
                completedAt: ""
            }
            // throw pizza; // TRY CATCH CAUGHT ReferenceError: pizza is not defined
        } catch (catchError) {
            console.log("TRY CATCH CAUGHT", catchError);
        }
    } // if/else body.completed (true)

} else if (body.text && _.isBoolean(body.completed)) {
    // USE CASE 3. Both re-word and toggle complete.
    console.log("useCase03 - SERVER.JS: PATCH.  body.completed ... body.text: ", body.completed + ' : ' + body.text);

    if (body.completed) {
        useCase03AFlag = true;
    } else {
        useCase03BFlag = true;
    }


    if (body.completed) {
        // User says to set 'completed' to TRUE = Completed!
        // (regardless of what it might have been before ...)
        mySetVar = {
            text: body.text,
            completed: body.completed,
            // We put a new date/time on its being marked completed:
            // Q. Can I put JavaScript logic right here like this? Think so...
            completedAt: body.completedAt = new Date().getTime() // ?
        }
        // NO "myUnsetVar"
    } else {
        mySetVar = {
            text: body.text,
            completed: body.completed
            // completedAt: body.completedAt
        }
        myUnsetVar = {
            completedAt: ""
        }
    }


} else { // SHOULD NOT GET HERE ...
    console.log("WARNING: SERVER.JS: PATCH. No body.text nor body.completed ? - hmm...");
    // Old, original code:
       // Not a Boolean. (Or even if it is a Boolean, it is Not True (a.k.a. False))
    // body.completed = false;
    // body.completedAt = null; // removes value from database

    useCase99WARNINGFlag = true;

}

// https://docs.mongodb.com/manual/reference/operator/update/inc/

/* **** 0001 *****************************************
***************     $SET, NO $UNSET  ***********
* findOneAndUpdate()
* Use Case 01, 02A, 03A  << Also '99' (Warning)
*
* ! MAYBE I SHOULD JUST USE THOSE DAMNED FLAGS !  <<<< YEP.
 * if (useCase01Flag || useCase02AFlag || useCase03AFlag)
*
* 01:
* ((typeof(body.completed) === 'undefined') && body.text)
 * ((typeof(body.completed) === 'undefined') && body.text) <<<< NO CHANGE NEEDED.
 *
 * 02A: Checked COMPLETE (and there is no text)
 * if (!body.text && _.isBoolean(body.completed) )
 * if (!body.text && _.isBoolean(body.completed) && body.completed )  <<<<< it is TRUE !!!
*
 * 03A: Checked COMPLETE  (and there is text)
 * (body.text && _.isBoolean(body.completed))
 * (body.text && _.isBoolean(body.completed) && body.completed) <<<<< it is TRUE!!!


** For this one 0001 - the common denominator is not so obvious as for 0002 below.
* In fact, there isn't a common denominator. Okay.

* *********************************************
* *********************************************
 */


if ( useCase01Flag || useCase02AFlag || useCase03AFlag || useCase99WARNINGFlag ) {
    console.log("WR__ 0001");

    Todo.findOneAndUpdate({
            _id: id,
            _creator: user._id // (from req.user; see above)
        },
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

        /*
         /!* Interesting. I wrote like so: (Also works) *!/
         { $set:
         {
         text: body.text,
         completed: body.completed,
         completedAt: body.completedAt
         }
         },
         */

// mySetVar varies from Use Case 1, 2, 3 ... Cheers:
        // https://docs.mongodb.com/manual/reference/operator/update/
        {
            $set: mySetVar
        },
        /*
         { $set: mySetVar,
         $unset: myUnsetVar // <<< This apparently FAILS when myUnsetVar is just an empty object: {}  Bummer.
         },

         Hmm, am I forced into some very non-DRY approach here?
         Sheesh.
         Use Case 02A = mark Completed - No $unset
         Use Case 02B = mark Not Completed - Need $unset on completedAt

         They 02A and 02B *can* share same API endpoint (good)
         But they (unfortunately) both need their own MongoDB find() query, to effect the $unset (or not).
         Bummer.

         If I have this right, that is. Oy.
         */


        {
            // MongoDB: false here gets you the updated doc, not the original doc
            // returnOriginal: false
            // Mongoose: true here gets you the updated ("new") doc, not the original doc
            new: true
        }).then((todo) => {
        if(!todo) {
            console.log("SERVER.JS: No todo found 404 Guess you had a mis-match USER/TODO console.log ");
        return res.status(404).send("SERVER.JS: No todo found 404 Guess you had a mis-match USER/TODO res.send ");
   /* Cool: My custom message in res.send() becomes "text:" property on the response object
        RES.ERROR:  Sent from here in server.js, over to test
        ...
         status: 404,
         text: 'SERVER.JS: No todo found 404 Guess you had a mis-match USER/TODO res.send ',
         method: 'PATCH',
         path: '/todos/587b65c08c56f1d59a678a1a'
         */


    }
    console.log("SERVER.JS: 0001 WR__ Here is our updated/patched todo! : ", todo);
    res.status(200).send({todo: todo});
}).catch((err) => {
        res.status(400).send(err); // usually that send() would be empty, not showing the err
});


} // /0001 if (useCase01Flag || useCase02AFlag || useCase03AFlag || useCase99WARNINGFlag)
/* *********************************************
* *********************************************
*/

    else {  //  <<<<<<<<<< SUPER IMPORTANT! Between 0001 and 0002


/* **** 0002 *****************************************
 ***************     $SET, & $UNSET  ***********
 * findOneAndUpdate()
 * Use Case 02B, 03B
 *
 * ! MAYBE I SHOULD JUST USE THOSE DAMNED FLAGS !  <<< YEP.
 * if ( useCase02BFlag || useCase03BFlag)
 *
 * 02B: Checked NOT complete (and there is no text)
 * if (!body.text && _.isBoolean(body.completed) )
 * if (!body.text && _.isBoolean(body.completed) && !body.completed )  <<<<< it is FALSE !!!

 * 03B: Checked NOT complete (and there is text)
 * (body.text && _.isBoolean(body.completed))
 * (body.text && _.isBoolean(body.completed) && !body.completed) <<<<< it is FALSE!!!
 *
 * Is perhaps the common denominator just this? :    hmmmmmmmm. No, I don't think so ...
 * // Well, maybe it is, since up above you already determined your 'mySetVar' viz. text or not. Hmm.   Here in '0002' we're just going to add the 'myUnsetVar', that's all. Hmm.
 * (_.isBoolean(body.completed) && !body.completed)

 * *********************************************
 * *********************************************
 */

if ( useCase02BFlag || useCase03BFlag ) {
    console.log("WR__ 0002");

    Todo.findOneAndUpdate({
            _id: id,
            _creator: user._id // (from req.user; see above)
        },
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

        /*
         /!* Interesting. I wrote like so: (Also works) *!/
         { $set:
         {
         text: body.text,
         completed: body.completed,
         completedAt: body.completedAt
         }
         },
         */

// mySetVar varies from Use Case 1, 2, 3 ... Cheers:
        // https://docs.mongodb.com/manual/reference/operator/update/
        // 0001:
/*
        {
            $set: mySetVar
        },
*/
  // 0002:
         { $set: mySetVar,
         $unset: myUnsetVar // <<< This apparently FAILS when myUnsetVar is just an empty object: {}  Bummer.
         },
/*
         Hmm, am I forced into some very non-DRY approach here?
         Sheesh.
         Use Case 02A = mark Completed - No $unset
         Use Case 02B = mark Not Completed - Need $unset on completedAt

         They 02A and 02B *can* share same API endpoint (good)
         But they (unfortunately) both need their own MongoDB find() query, to effect the $unset (or not).
         Bummer.

         If I have this right, that is. Oy.
         */


        {
            // MongoDB: false here gets you the updated doc, not the original doc
            // returnOriginal: false
            // Mongoose: true here gets you the updated ("new") doc, not the original doc
            new: true
        }).then((todo) => {
        if(!todo) {
        return res.status(404).send();
    }
    console.log("SERVER.JS: 0002 WR__ Here is our updated/patched todo! : ", todo);
    console.log("SERVER.JS: 0002 WR__ Special Note for '0002': -------- ");
    console.log("Here in code, completedAt: reads 'null', but in MongoDB it is GONE (good), owing to $unset. Cheers.");
    res.status(200).send({todo: todo});
}).catch((err) => {
        res.status(400).send();
});




} // /0002 /if ( useCase02BFlag || useCase03BFlag)
/* *********************************************
 * *********************************************
 */


 } // <<<<<<< IMPORTANT!  FINAL brace to big if/else/if 0001, 0002

}); // /app.patch /todos/:id



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




// **********
// POST /users/login (email, password)
// LECTURE 95

/*
Find an existing user in MongoDB matching
use lodash _ 'pick'
 */

app.post('/users/login', (req, res) => {
    var emailPassedIn = req.body.email;
var passwordPassedIn = req.body.password;
/* Working fine:
 console.log("WR__ 11 req.body: ", req.body);
 console.log("WR__ 22 emailPassedIn: ", emailPassedIn);
 console.log("WR__ 33 passwordPassedIn: ", passwordPassedIn);
 */

var body = _.pick(req.body, ['email', 'password']); //
console.log("SERVER.JS: lodash _.pick body? ", body);
console.log("req.body? ", req.body);
/*
 lodash _.pick body?  { email: 'HASH99@rabbit.com', password: '123456' }
 req.body?            { email: 'HASH99@rabbit.com', password: '123456' }

 Though if the request does come with more stuff ... pick gets you what you want. Bon.
 e.g.
 POST: {
 "email": "HASH99@rabbit.com",
 "password": "123456",
 "extrastuff": "please ignore"
 }

 lodash _.pick body?  { email: 'HASH99@rabbit.com', password: '123456' }
 req.body?            { email: 'HASH99@rabbit.com', password: '123456', extrastuff: 'please ignore' }
 */

/*
 Nope! Don't do this SALTED HASH business! (use bcyrpt.compare() instead)

 var hashPasswordPassedIn = bcrypt.genSalt(12, (err, salt) => {
 bcrypt.hash(passwordPassedIn, salt, (err, hash) => {
 console.log("WR__ 66 hash: ", hash);
 return hash;
 });
 });
 */

/*
 .catch((err) => {
 console.log("WR__ 44 Rats err: ", err);
 });
 */

// console.log("WR__ 55 hashPasswordPassedIn: ", hashPasswordPassedIn);

/*
 REFACTOR TIME!!
 We're going to put the "FIND" over to a User model method (UserSchema.statics)
 "findByCredentials"
 Take an EMAIL (that's it)
 Find One user with that EMAIL (There should be only one)
 THEN test that returned document for password/hash match, using compare()

 Returns: 1) document for the user, 2) (enhanced) AUTH Token too
 */
User.findByCredentials(body.email, body.password).then((user) => {
/*
Huh. O.K. Am learning from looking at Instructor code, that here we do NOT need/use a "if(!user)" test.
That IF test was already handled down at the USER.JS function (findByCredentials()). if(!user) that function does a Promise.reject, and the Promise.reject when it gets here, just gets shunted all the way down to our CATCH(error).
So that is why we "never get here" in the line just below.
O.K. Bon.
 */
/* NOT NEEDED: (read above)
    if (!user) {
    console.log("WR__ SERVER.JS findByCredentials !user: nuttin' here neither "); // No we never get here. (Seems.)
    return res.status(404).send('oops No User - findByCredentials');
    // reject promise thing will be enhancement here ...
}
*/
console.log("WR__ SERVER.JS findByCredentials call. user: ", user);
/*
Woot. We got a user.
- Known e-mail. Good.
- Plain text password provided does match bcrypt.compare() to stored hash. Good.
Now, time to give this nice person a Token. :o)
%%%%%%%%%% TOKEN TIME!!!! %%%%%%%%%%%%
 */
return user.generateAuthToken().then((token) => {
    if(token) { // hmm, Instructor code does not have this if(token) test
        // Just plow ahead, do the 'res' thing. If no token, if errors, 'catch()' will get you.... :)
        res.header('x-auth', token);
        res.status(200).send({'myMsg': "Congrats ENCORE! you\'re logged in, user: ", myUser: user});
    } else { // hmm, again Instructor code does not have this "error" condition biz. Unreachable code??
        Promise.reject('Error issuing auth token!');
    }
});
}).
catch((error) => {
    console.log('error: ', error); // Yes, this gets the reject('reason rejected') message. Great!
    res.status(400).send('oops Something Went Wrong with the user we did findByCredentials, hmm...');
})
;
}); // /app.post(users/login)

/*
User.findOne({
    email: emailPassedIn,
/!*
    password: bcrypt.genSalt(12, (err, salt) => {
        bcrypt.hash(passwordPassedIn, salt, (err, hash) => {
        console.log("WR__ 66INSIDE hash: ", hash);
return hash;
});
})
*!/

// HAHD-CODE THE SUCKAH!
    /!*
    THAT worked:
     Congrats you're logged in, user: { _id: 586d747155e6e854b3e20aff,
     email: 'HASH99@rabbit.com',
     password: '$2a$04$hEyqJ7zvC41oH1OMhF/sxus3V0unAywtPWCJAQ75LcZ0WzcCcKKSS',
     __v: 1,
     *!/
password: '$2a$04$hEyqJ7zvC41oH1OMhF/sxus3V0unAywtPWCJAQ75LcZ0WzcCcKKSS'

// password: hashPasswordPassedIn

}).then((user) => {
    if(!user) {
        return res.status(404).send('Login Error: No User Found!');
}
// Get a TOKEN for them too!! TODO
res.status(200).send('Congrats you\'re logged in, user: ' + user);
});

// next();
});
*/

app.delete('/users/me/token', authenticate, (req, res) => {
    // req.token available (from authenticate.js)
    // new Instance Method on model
    // removeToken 'returns' results here such that it can be chained on .then()...
    req.user.removeToken(req.token).then(
        // resolve function (positive result from then promise)
        () => { // empty parens; not getting any data back, or at least not that we will make any use of
        res.status(200).send();
},
// reject function (negative/error from then promise)
() => {
        res.status(400).send();
});
});


// app.listen(3000, () => {
    app.listen(port, () => {
    console.log(`Started express node server on port ${port} `);
})

// ES5 Set the 'app' variable herein (on right side)
// on to the 'app' key on the module.exports object (on left side)
// module.exports = { app: app };
// ES6 way shortcut:
module.exports = { app };