/**
 * Created by william.reilly on 12/22/16.
 */

const expect = require('expect');
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { User } = require('./../models/user');
const { Todo } = require('./../models/todo');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

beforeEach(populateTodos); //
beforeEach(populateUsers); //

/* *************** */

describe('POST /todos', () => {

    // ASYNC. Use done.
    it('should create a new todo', (done) => {
    var text = 'wot i got';

    request(app)
        .post('/todos') // dumkopf! I had ('./todos') Ugh!
        // ES5: set 'text' from herein to 'text' on send object.
        .set('x-auth', users[0].tokens[0].token) // userOne has an 'auth' token, from SEED.JS
        .send({text: text})
        .expect(200)
        .expect((res) => {
        expect(res.body.text).toBe(text);
})
.end((err, res) => {
        if (err) {
            return done(err);
        }
        // DATABASE STUFF:
        // ES5 way = Yep
        Todo.find({text: text}).then((todos) => { // fetch 'em all!
        // ES6 way = Also Yep
        // Todo.find({text}).then((todos) => { // fetch 'em all!
        expect(todos.length).toBe(1);
    expect(todos[0].text).toBe(text);
    done();
}).catch((err) => done(err)); // ... (video quit here!) ~~10:00 ? (of 19:49)

}); // /.end
}); // /it()



it('should NOT create todo with BAD invalid data', (done) => {
    var notSendingAnythingThisTime = 'not going to be used. hah!';

request(app)
    .post('/todos')
    .set('x-auth', users[0].tokens[0].token)
    .send({}) // EMPTY object. hah!
    .expect(400)
    .end((err, res) => {
    if(err) {
        console.log("hey!", err);
        return done(err);
    }
// find() and find({}) seem to do same thing: return ALL docs
    Todo.find().then((todos) => {
    // Todo.find({}).then((todos) => {
    expect(todos.length).toBe(4); // (0) // Now it's 4. NONE! hah!
done(); // AARRGGHH. I was missing this. sad.
}).catch((err) => {
    done(err)
}) // /.catch
}); // /.end
}); // /it()

}); // /describe()
/* *******
 * */


describe('GET /todos', () => {
    it('should get all todos FOR ONE USER', (done) => {
    request(app)
        .get('/todos')
        .set('x-auth', users[0].tokens[0].token) // userOne has an 'auth' token, from SEED.JS
        .expect(200)
        .expect((res) => {
        // expect(res.body.todos.length).toBe(4);
        // Now with authentication, one user has *2* todos (vs. previous just *1* apiece). Cheers.
        expect(res.body.todos.length).toBe(2);
})
.end(done);
});
});

describe('GET /todos/:id', () => {
    /*
     With AUTHENTICATION now, we have to indicate: todos[0] was created by UserOne, users[0], get that user's token:
     */
    it('should return todo doc', (done) => {

    request(app)
        .get(`/todos/${todos[0]._id.toHexString()}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
        expect(res.body.todoDoc.text).toBe(todos[0].text)
})
.end(done); // << Correct

}); // /it

/* AUTHENTICATION. New Test:
 A user should not be able to get back todo items that don't belong to her.
 */
it('should not return any todo doc to a user that doesn\'t own that todo', (done) => {
    /*
     e.g. todos[2] is owned by users[1]
     but we'll send todos[2] with a token from users[0]
     */
    console.log(`WR__ $$$ /todos/${todos[2]._id}`);
console.log(`WR__ $$$HEX /todos/${todos[2]._id.toHexString()}`);
/* HEX STRING STUFF SEEMS TO NOT MATTER ... fwiw
 WR__ $$$    /todos/58777c8e4660b4211850a95a
 WR__ $$$HEX /todos/58777c8e4660b4211850a95a
 */


request(app)
    .get(`/todos/${todos[2]._id}`)
    .set('x-auth', users[0].tokens[0].token) // USER ONE
    .send({id: todos[2].id})
    .expect(404)
    .end(done);
});

it('should return 404 if todo not found', (done) => {
    // toHexString new ObjectId()  won't be in the collection
    // get a 404 back
    var justMadeId = new ObjectID(); // won't be found
/*
 With AUTHENTICATION now, even for this "error" test, we still have to send in a token as if for a "logged-in" user: e.g. UserOne, users[0], get that user's token:
 */
request(app)
    .get(`/todos/${justMadeId.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404) // Test is: do I get a 404 back?
    .end(done);
});


it('should return 404 for NON-ObjectId', (done) => {
    // /todos/123  << Not an ObjectId
    // get a 404 back

    /*
     console.log("what is done? ", done);
     http://stackoverflow.com/questions/37646949/what-is-the-point-of-the-done-callback
     */
    var notEvenAnObjectId = '123';
/*
 As above - With AUTHENTICATION now, even for this "error" test, we still have to send in a token as if for a "logged-in" user: e.g. UserOne, users[0], get that user's token:
 */
request(app)
    .get(`/todos/${notEvenAnObjectId}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404) // Test is: do I get a 404 back?
    .end(done);
});

}); // /describe :id




// /////////////////////////////////
// //////// DELETE TODO ////////////

describe('DELETE /todos/:id', () => {

    /* We'll delete this one: todos[1]
     (which was "created" by userOneId (users[0]) )

     (from array todos over in SEED.JS):
     {
     _id: new ObjectID(),
     text: 'Seeded Test todo 02',
     completed: true,
     completedAt: 1000,
     _creator: userOneId
     },
     */

// ////////   AUTH TEST: CORRECT USER!!  ///////////////////
    it('should remove a todo', (done) => {

    // Hmm, (above) we have an actual ObjectId (not just a String). So:
    // http://mongodb.github.io/node-mongodb-native/2.2/api/ObjectID.html#toHexString
    var hexStringId = todos[1]._id.toHexString(); // 24 chars long String

    request(app)
        .delete(`/todos/${hexStringId}`)
        .set('x-auth', users[0].tokens[0].token)
        .expect(200)
        .expect((res) => {
        expect(res.body.todo._id
)
.toBe(hexStringId)
})
.end((err, res) => {
        if(err) {
            console.log('Hmm. API error on DELETE : ', err);
            return done(err);
        }
        // // Now, QUERY the DATABASE to ensure doc was deleted. Do so using findById; test: .toNotExist()
        // .catch(e) ...

        var BROKENId = new ObjectID(); // chuck it in...
    var BROKEN = 'glog'; // chuck it in...

    Todo.findById(hexStringId).then((todo) => { // This is Correct test line. Bon. Passes.
        // Todo.findById(BROKENId).then((todo) => { // OK. This hits Error # 3 below. Database search runs. Then the EXPECT-toExist fails. Bon.
        //     Todo.findById(BROKEN).then((todo) => { // COOL. This hits Error # 2 below. Excellent. Broken database search
        // success getting to db at least
        // Our test is that, at this point, the doc does not exist
        expect(todo).toNotExist(); // Correct test
    // expect(todo).toExist(); // << BROKEN test
    done();

}, (err) => {
        // error
        console.log('Hmmm # 2. DELETE REJECT Funct. Nice. Error, in Mongoose driver going to database:err.message ', err.message); // 'Cast to ObjectId failed for value "glog" at path "_id" for model "Todo"'
        return done(err);
    }).catch((catchError) => {
        console.log('Hmmm # 3. CATCHError, : ', catchError);
    return done(catchError);
}); // /.catch(   .then(todo   .findById(
}); // /.end(err, res
}); // /it(remove one successfully)







// ///////  AUTHENTICATION TEST: MIS-MATCH USER! /////////
it('should NOT Delete the todo UNLESS it is owned by the person deleting!', (done) => {
    /* MIS-MATCH: (on purpose!)
     We'll test userOneId trying to delete a userTwoId todo item:
     users[0] >>> todos[2] = No Can Do
     */
    request(app) // << request is SUPERTEST!
    .delete(`/todos/${todos[2]._id}`)
    .set('x-auth', users[0].tokens[0].token)
    .send() // empty body I think works, yes?
    .expect(404) // no, delete failed (WRONG users[0]
    // .expect(200) // YES to DELETE (RIGHT users[1])
    /* No. We won't get any data/document back. (I think) << WRONG
     .expect((res) => {
     expect(res.body.)
     })
     */
    .end((err, res) => {

    if (err) {
        console.log("DELETE TEST .end err: ", err);            return done(err);
    }

    console.log("DELETE TEST NO ERR. ergo, .end res.body: ", res.body);

Todo.findById(todos[2]._id).then((todo) => {

// Need a better test. Doc won't even be found. Hmm.
// On other hand, we are using this same test to test the opposite, positive. Hmm. Oo-la.
    expect(todo.text).toBe('Seeded Test todo 03'); // SEED.JS: text: 'Seeded Test todo 03',
done();
}).catch((error) => {
    console.log("SERVER.TEST.JS WR__ 8787 error in the catch DELETE TODO : ", error);
/* OK:
 WR__ 8787 error in the catch DELETE TODO :  TypeError: Cannot read property 'text' of null
 */
return done(error);
}); // /catch()
}); // /end()
}); // /it()






it('should return 404 if todo not found', (done) => {
    // Hmm, just make one up? (It won't be in the db)
    var myHexId = new ObjectID().toHexString();

request(app)
    .delete(`/todos/${myHexId}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);

}); // /it(404 not found)



it('should return 404 if ObjectId is invalid', (done) => {

    var myBadIdString = 'notanobjectid123';

request(app)
    .delete(`/todos/${myBadIdString}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);

}); // /it(404 invalid)


}); // /describe(DELETE)



// //////// PATCH TODO ////////////
/*
 1) should update the todo
 - Use Case 01 - Change TEXT (only)
 - Use Case 02(A) - Change/Send (Only) Completed (TRUE)
 - Use Case 02(B) - Change/Send (Only) Completed (FALSE)
 - Use Case 03(A) - Change TEXT & Completed (TRUE)
 - Use Case 03(B) - Change TEXT & Completed (FALSE)
 2) should NOT update the todo, if not the right user!
 3) should clear completedAt when todo is not complete
 4) should return 404 for ObjectId not in database
 5) should return 404 for NON-ObjectId
 */

describe('PATCH /todos/:id', () => {


    it('should update the todo  - Use Case 01 - Change TEXT', (done) => {
    var idFor01 = todos[1]._id; // e.g. whatever the new ObjectID() yielded
    // console.log('idFor01 is ', idFor01); // 586550fc7977115839d89e6e

    var textWrote = "Something I wrote in a test. 01.";

    // update text ONLY
    request(app)
        .patch(`/todos/${idFor01}`)
        .set('x-auth', users[0].tokens[0].token)
        .send({
            text: textWrote // text was something else; here we're now updating!
        })
        .expect(200) // same as next lines:
        .expect((resfoo) => { // Call the 'res' (response) whatever you like ...
        expect(resfoo.status).toBe(200);
})
.expect((res) => {
        expect(res.body.todo.text).toBe(textWrote);

// All true of todos[1]: (as originally in SEED.JS)
    expect(res.body.todo.completed).toBe(true);
    expect(res.body.todo.completedAt).toExist();
    expect(res.body.todo.completedAt).toBeA('number');
    expect(res.body.todo.completedAt).toEqual(2000);
    // https://www.npmjs.com/package/expect
})
// .end(done); // <<< Works. Could end here, w. response from API
    // We'll go on to the database:
.end((err, res) => {
        if (err) {
            return done(err);
        }
        var BROKENId = new ObjectID(); // chuck it in...

    Todo.findOne(idFor01).then((todo) => {
        //     Todo.findOne(BROKENId).then((todo) => { // Hmm. I'm doing something weird. Getting 'PASS' *and* 'FAIL' in this test. Very clever.
        /*
         ✓ should update the todo  - Use Case 01 - Change TEXT (46ms)
         1) should update the todo  - Use Case 01 - Change TEXT

         I have 10 tests. Getting "11" results. ????? Ah well let it go...
         10 passing (760ms)
         1 failing

         1) PATCH /todos/:id should update the todo  - Use Case 01 - Change TEXT:
         TypeError: Cannot read property 'text' of null
         */
        // Todo.findOne({_id:'texas'}).then((todo) => { // 'Cast to ObjectId failed for value "texas" at path "_id" for model "Todo"'
        /* HERRO PEOPLE.
         This approach STINKS:
         Mo' better: 2 functions for the ".then()" Promise to handle. OK?
         if (!todo) {
         return('hey there no todo for you Use Case 01');
         }
         */
        // RESOLVE Function, for our ".then()" Promise above
        expect(todo.text).toBe(textWrote);
    expect(todo.completed).toBe(true);
    expect(todo.completedAt).toExist();
    expect(todo.completedAt).toBeA('number');
    expect(todo.completedAt).toEqual(2000);

}, (err) => {
        // MO BETTER! HEre is our REJECT function for that ".then()" Promise guy up above. Cheers
        console.log('Hmmm # 2. PATCH 01 REJECT Funct. Nice. Error, in Mongoose driver going to database:err.message ', err.message); // 'Cast to ObjectId failed for value "glog" at path "_id" for model "Todo"'
        return done(err);
    }).catch((catchError) => { // AND (MO' BETTER) YES WE *STILL* DO A CATCH! Lovely.
        return done(catchError);
}); // /.catch(  .then(   .findOne(
    done();
}); // /.end(err, res
}); // /it should update the todo...



it('should update the todo   - Use Case 02(A) - Change/Send (Only) Completed (TRUE)', (done) => {
    var idFor01 = todos[1]._id; // e.g. whatever the new ObjectID() yielded

request(app)
    .patch(`/todos/${idFor01}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
        completed: true
    })
    .expect(200) // same as next lines:
    .expect((resfoo) => { // Call the 'res' (response) whatever you like ...
    expect(resfoo.status).toBe(200);
})
.expect((res) => {
    expect(res.body.todo.text).toBe('Seeded Test todo 02'); // unchanged, from SEED.JS
expect(res.body.todo.completed).toBe(true);
expect(res.body.todo.completedAt).toExist();
expect(res.body.todo.completedAt).toBeA('number'); // https://www.npmjs.com/package/expect
expect(res.body.todo.completedAt).toNotEqual(2000); // SEED was 2000, but now should be new Date() etc.
})
// .end(done); // <<< Works! Could end right here! W. response from API
// But we'll also go to the database itself, see what we find...
.end((err, res) => {
    if (err) {
        return done(err);
    }
    Todo.findOne(todos[1]._id).then((todo) => {
    if (!todo) {
    return ('Hmm no todo found for you. Use Case 02A');
}
expect(todo.text).toBe(todos[1].text); // That is, unchanged
expect(todo.completed).toBe(true);
expect(todo.completedAt).toBeA('number');
expect(todo.completedAt).toNotEqual(2000); // 2000 was original value
}).catch((catchError) => {
    return done(catchError);
}); // /.catch(  .then(   .findOne(
done();
}); // /.end((err, res

}); // /it should update the todo...

/*
 Notes - testing breaking it: Good.

 SHOULD BE *NOTEQUAL*:
 expect(todo.completedAt).toEqual(2000); // 2000 was original value

 Error: Expected 1484493070283 to equal 2000
 + expected - actual

 -1484493070283
 +2000
 */



it('should update the todo   - Use Case 02(B) - Change/Send (Only) Completed (FALSE)', (done) => {
    var idFor01 = todos[1]._id; // e.g. whatever the new ObjectID() yielded

request(app)
    .patch(`/todos/${idFor01}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
        completed: false
    })
    .expect(200) // same as next lines:
    .expect((resfoo) => { // Call the 'res' (response) whatever you like ...
    expect(resfoo.status).toBe(200);
})
.expect((res) => {
    expect(res.body.todo.text).toBe('Seeded Test todo 02'); // from SEED.JS
expect(res.body.todo.completed).toBe(false);
expect(res.body.todo.completedAt).toNotExist();
/* Big Ol' N/A for our setting completed to FALSE:
 expect(res.body.todo.completedAt).toBeA('number'); // https://www.npmjs.com/package/expect
 expect(res.body.todo.completedAt).toNotEqual(2000); // SEED was 2000, but now should be new Date() etc.
 */
})
// .end(done); // << Works. We could stop here, w. response from API
// But we'll Go To The Database:
.end((err, res) => {
    if(err) {
        return done(err);
    }
    Todo.findOne(idFor01).then((todo) => {
    if (!todo) {
    return ('did not find a todo for you Use Case 02B');
}
expect(todo.text).toBe('Seeded Test todo 02');
expect(todo.completed).toBe(false);
expect(todo.completedAt).toNotExist();
}).catch((catchError) => {
    return done(catchError);
}); // /.catch(   .then(   .findOne(
done(); // << Here! :o)
}); // //end((err, res
// done(); // Not Here!  :o(
}); // /it should update the todo...


// **************************  03A : Patch BOTH Text and Completed (TRUE) ************
it('should PATCH both Text and Completed to TRUE. Match of user and todo. Use Case 03A', (done) => {
    var todoMatch = todos[1];
var userMatch = users[0];
console.log("SERVER.TEST.JS: Use Case 03A. todoMatch: ", todoMatch);
console.log("SERVER.TEST.JS: Use Case 03A. userMatch: ", userMatch);
request(app)
    .patch(`/todos/${todoMatch._id}`)
    .set('x-auth', userMatch.tokens[0].token)
    .send({
        text: "New Stuff from Test 03A",
        completed: true
    })
    .expect(200) // << This IS working. We do get 200. All right.
    .end((err, res) => {
    console.log("SERVER.TEST.JS: Use Case 03A. expect((res) do we everget here?: res.body: ", res.body);
console.log("* /res.body *******************************************");
if (err) {
    console.log("SERVER.TEST.JS: Use Case 03A. expect((res) do we everget here?: ERR ", err);
    console.log("* /err *******************************************");
    return done(err); // << Need to call done, my understanding ...
    // return (err);
}
// done(); // << No, not here? Error: done() called multiple times
// NO: }); // /.end((err, res) <<< This goes AFTER findOne!
// Todo.findOne({_id:todoMatch._id}).then((todo) => { // both work (_id) and ({_id:_id}) Bon.
Todo.findOne(todoMatch._id).then((todo) => {
    expect(todo.text).toBe("New Stuff from Test 03A");
expect(todo.completed).toBe(true);
expect(todo.completedAt).toBeA('number');
}).catch((catchError) => {
    console.log("SERVER.TEST.JS: Use Case 03A. Todo.findOne catchError  ", catchError);
console.log("* /catchError *******************************************");
return done(catchError);
}); // /.catch(
done(); // Whew!
}); // /.end((err, res)
}); // /it should Use Case 03A
// **************************  /03A ********************



// **************************  03B : Patch BOTH Text and Completed (FALSE) ************
it('should PATCH both Text and Completed (FALSE) - Use Case 03B', (done) => {
    request(app)
    .patch(`/todos/${todos[1]._id}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
        text: "Here in Use Case 03B new Text and FALSE completed!",
        completed: false
    })
    .expect(200)
    .end((err, res) => {
    if (err) {
        return done(err);
    }
    Todo.findOne(todos[1]._id).then((todo) => {
    if (!todo) {
    return("Huh no todo Use Case 03A"); // ?
}
expect(todo.text).toBe("Here in Use Case 03B new Text and FALSE completed!");
expect(todo.completed).toBe(false);
expect(todo.completedAt).toNotExist();
done();
}).catch((catchError) => {
    return done(catchError);
}); // /.catch( .then(  .findOne(
}); // /.end((err, res)
}); // /it shoule Use Case 03B
// **************************  /03B : Patch BOTH Text and Completed (FALSE) ************


// ********** MISSED ONE! **********
// ====================================
it('should NOT update (PATCH) the todo if WRONG user, friend', (done) => {
    /* We'll try simply todos[2] and users[0] (WRONG) Mis-Match (on purpose)  */
    request(app)
    .patch(`/todos/${todos[2]._id}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
        text: "Trying to PATCH todo for WRONG user = No no.",
        completed: true
    })
    // .expect(200) // Incorrect test
    .expect(404) // Correct test
    .end((err, res) => {
        if (err) {
            return done(err);
        }
        Todo.findById(todos[2]._id).then(
// RESOLVE Promise
           (todo) => {

/* Hmm, guess one is a String, or something ?
 Error: Expected
 587ccb283b7a3dfddb359249 to be
 587ccb283b7a3dfddb359249
 */
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
    console.log("typeof(todo._id): ", typeof(todo._id) + ' : ' + todo._id);
console.log("typeof(todos[2]._id): ", typeof(todos[2]._id) + ' : ' + todos[2]._id);
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");
console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@");

/*
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 typeof(todo._id):      object : 587ccccb7916b3fe0ddd59f1
 typeof(todos[2]._id):  object : 587ccccb7916b3fe0ddd59f1
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 @@@@@@@@@@@@@@@@@@@@@@@@@@@
 */

/*
Hah-ah. Guess they're both OBJECTS, such that they may be EQUAL, but they are NOT "the same".
Not: 'toBe' (the same (Object)).
But: 'toEqual' (each other, despite being different Objects).
H'okay. Lesson learned. (hopefully)
 */
// expect(todo._id).toBe(todos[2]._id); // NOPE.
expect(todo._id).toEqual(todos[2]._id); // YEP!


    expect(todo.text).toBe('Seeded Test todo 03'); // from SEED.JS
done(); // <<< Don't Forget !!! (like I did)
},
// REJECT Promise
   (err) => {
    console.log("Ratzenfratzen. No todo found for some reason (we searched on todo._id only, not on user as well)");
    console.log(`todo _id: ${todos[2]._id}`);
    console.log(`Hmm .... user _id: ${users[0]._id}`);
    return done(err);
}).catch((catchError) => {
    console.log("catchError ", catchError);
    return done(catchError);
}); // /.catch(  .then(   .findById(
}); // /.end((err, res
}); // /it(should  NOT PATCH todo for WRONG user


it('should clear completedAt when todo is not complete', (done) => {
    // grab encore id of second item
    // update text to something; set completed false
    // 200
    // expect .... text changed; completed false; completedAt is null .toNotExist()

    // grab encore id of second item
    var idFor02 = todos[1]._id;
var newText = "Nobody knows you when you're, down & out...";

request(app)
    .patch(`/todos/${idFor02}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
        text: newText,
        completed: false // was true, and had a completedAt.
    })
    .expect((response) => {
    expect(response.status).toEqual(200);
expect(response.statusCode).toEqual(200); // b'lieve this works, too. Yep.
})
.expect((response) => {
    // console.log("WR__ WTH response: ", response); // big ol' response object
    expect(response.body.todo.text).toEqual(newText);
expect(response.body.todo.completed).toBe(false);
expect(response.body.todo.completedAt).toNotExist(); // be null, that is.
})
.end(done);

// update text to something; set completed false
// 200
// expect .... text changed; completed false; completedAt is null .toNotExist()

}); // /it(should clear completedAt...)


/*
 OK: Three more:
 1) PATCH sending no data ? Hmm. guess that yields an empty item ??
 2) PATCH sending ObjectId that is not in database
 3) PATCH sending a NON-ObjectId
 Well, let's do # 2 and # 3 anyway.
 # 1 is sort of existential.
 A # 4 might be: Send a non-Boolean to our 'completed' field, etc., but, I'm going to skip doing that much bullet-proofing ...
 */




it('should return 404 for ObjectId not in database', (done) => {
    var giffiedUpObjectId = new ObjectID(); // won't be in database

request(app)
    .patch(`/todos/${giffiedUpObjectId}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done);

}); // /it 404 ObjectId

it('should return 404 for NON-ObjectId', (done) => {
    var myNonObjectId = '45';

request(app)
    .patch(`/todos/${myNonObjectId}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(404)
    .end(done)

}); // /it 404 NON-ObjectId


}); // /describe(PATCH)


/* **********  USERS ************** */
describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {

    //supertest
    request(app)
        .get('/users/me')
        .set('x-auth', users[0].tokens[0].token) // kinda hard-coded; get off our test user data (seed.js)
        .expect(200)
        .expect((res) => {
        /* Leaving off the .toHexString() yields:
         Error: Expected '586cd340328c593bbad7ffe6' to be 586cd340328c593bbad7ffe6
         */
        // expect(res.body._id).toBe(users[0]._id);
        expect(res.body._id).toBe(users[0]._id.toHexString());        expect(res.body.email).toBe(users[0].email);
})
.end(done);
});

it('should return a 401 if No Token', (done) => {

    // TypeError: Cannot read property '0' of undefined
    // console.log('WR__ 334', users[1].tokens[0].token);

    request(app)
    .get('/users/me')
    // We do NOT set header nor send auth token...
    // Hmmm, how about the "token" on user that doesn't have one ? null? undefined? error? hmm... TYPE ERROR
    // TypeError: Cannot read property '0' of undefined
    // .set('x-auth', users[1].tokens[0].token) // <<< NOPE!
    .expect(401) // Unauthorized!
    .expect((res) => {
    // console.log("WR__ 33 401 No Token res.body: ", res.body); // {}
    expect(res.body).toEqual({});
})
.end(done);
});
});



describe('POST /users', () => {
    it('should create a user', (done) => {
    var email = 'exby@example.com';
    var password = '123abc';

    request(app)
        .post('/users')
        .send({email: email, password: password})
        .expect(200)
        .expect((res) => {
        expect(res.headers['x-auth']).toExist();
    console.log("WR__ 123 res.body: ", res.body);
    /* My API wraps it in  user: {}
     SERVER.JS:   res.header('x-auth', token).send( { user: newUser });

     WR__ 123 res.body:  { user: { _id: '586cdc4d29f2d23e28a879a0', email: 'exby@example.com' } }
     */
    // expect(res.body._id).toExist(); // << Nope.
    // expect(res.body.email).toBe(email); // << Nope.
    expect(res.body.user._id).toExist();
    expect(res.body.user.email).toBe(email);
})
    /*
     Below, instead of simply passing done, we can Go Further.
     Our custom function can go to the database, make sure of what we got ... :o)
     */
// .end(done);
.end((err) => {
        if(err) {
            return done(err);
        }

        User.findOne({email: email}).then((user) => {
        expect(user).toExist();
    expect(user.password).toNotBe(password); // We Hashed It!!
    done();
})
.catch((error) => { done(error) });
});
});

it('*************** should not create user if email already taken', (done) => {
    // exby@example.com
    request(app)
    .post('/users')
    .send({email: users[0].email}) // redundant!
    .expect(400)
    .end(done);
});


describe('INVALID REQUESTS to POST /users', () => {
    it('should return validation errors if request invalid: BAD E-MAIL', (done) => {
    // not an email
    // password shorter than 6 chars

    /*
     I have TWO things to test.
     I think I need TWO 'it()' calls, not one.
     */
    request(app)
        .post('/users')
        .send({email: 'dudeATblingDOTcom', password: '123456'})
        .expect(400) // b-a-d
        .end(done);
});

it('should return validation errors if request invalid: BAD PASSWORD', (done) => {

    request(app)
    .post('/users')
    .send({email: 'dude@bling.com', password: '123'})
    .expect(400) // b-a-d password
    .end(done);

});

}); // NESTED DESCRIBE.  Hmm, the following test comes BEFORE the nested biz. Not Intuitive. Hmmph.

it('$$$$$$$$$ $$$$$$$$$$$ *************** should not create user if email already taken', (done) => {
    // exby@example.com
    request(app)
    .post('/users')
    .send({email: users[0].email}) // redundant!
    .expect(400)
    .end(done);
});


});


// ////////// LECTURE 96 ///////////
describe('POST /users/login', () => {
    it('should login user and return token (valid user, pw)', (done) => {
    /*  SEED.JS  sample data:
     {
     _id: userTwoId,
     email: 'joe222@example.com',
     password: 'userTwoPass'
     }
     */

    request(app) // SUPERTEST is request
        .post('/users/login')
        .send({email: users[1].email, password: users[1].password})
        .expect(200)
        .expect((res) => {
        console.log('TEST RES.BODY: ', res.body);
    /*
     TEST RES.BODY:  { myMsg: 'Congrats ENCORE! you\'re logged in, user: ',
     myUser: { _id: '58761083626b635ebb0f8d75', email: 'joe222@example.com' } }
     */
    console.log('TEST RES.HEADERS: ', res.headers);
    /*
     TEST RES.HEADERS:  { 'x-powered-by': 'Express',
     'x-auth': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ODc2MGZjNGM0ZTFjNzVlOTUyZWE3ODAiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNDg0MTMyMjkzfQ.3Ec_VuxJevromEg_BSJjxvZ6A7WPy98IjYcZh2BuXmc',
     'content-type': 'application/json; charset=utf-8',
     'content-length': '126',
     etag: 'W/"7e-XBlR+5C7nvL/F2tUmtrPqw"',
     date: 'Wed, 11 Jan 2017 10:58:13 GMT',
     connection: 'close' }
     */
    // res.headers.x-auth
    // res.header.x-auth  << Also. Hmm.
    // expect(res.res.IncomingMessage.headers.x-auth).ToExist();
    // expect(res.headers.x-auth).toExist(); // << Nope.
    expect(res.headers['x-auth']).toExist();
    // expect(res.headers).toExist();
    // expect(res.res.IncomingMessage.body.myUser.email).ToBe(users[1].email);
    expect(res.body.myUser.email).toEqual(users[1].email);
})
// .end(done);
.end((err, res) => {
        if (err) {
            return done(err);
        }
        // Look in the database, see the new token:
        User.findOne({email: res.body.myUser.email}).then((user) => {
        if (!user) {
        return; // ...
    }
    // otherwise:
    console.log("WR__ HERE THE USER from database: ", user);
    /*
     WR__ HERE THE USER from database:  { _id: 5876164f35eb575f2fc3c12b,
     email: 'joe222@example.com',
     password: '$2a$04$d1ozlbeGnJPlB2GJtaSZie3XLLcyJYDEnAqeoQPB6EDDG59Hu.R1y',
     __v: 1,
     tokens:
     [ { access: 'auth',
     token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ODc2MTY0ZjM1ZWI1NzVmMmZjM2MxMmIiLCJhY2Nlc3MiOiJhdXRoIiwiaWF0IjoxNDg0MTMzOTY3fQ.9GP3y5ESdwDx7tsIGCJqRf4f8fh1siuyAHchSUUbhFA',
     _id: 5876164f35eb575f2fc3c150 } ] }
     */
    // expect(user.tokens.access).toBe("auth"); // No. << ARRAY!!

    /* AUTHENTICATION TESTING:
     We use 2nd user, who in past had no tokens.
     The POST /users/login process gave user # 2 one token
     Now, user # 2 has one token from SEED, (why? because with authentication now throughout the app, it needs it).
     But now this POST /users/login gives user # 2 a SECOND token. It is that second token that is the one we test for, below.
     */
    // expect(user.tokens[0].access).toBe("auth"); // Yep.
    // expect(user.tokens[0]).toInclude({
    expect(user.tokens[1].access).toBe("auth");
    expect(user.tokens[1]).toInclude({
        access: "auth",
        token: res.headers['x-auth']
    });
    done();
})
.catch((error) => { done(error) });
    /*
     User.findOne({email: res.body.myUser.email}).then((resolve, reject) => {

     })
     */
});
});

/* YES!  WORKS. MY RE-WRITE OF ABOVE TEST. VERY NICE. ****
 it('should reject invalid login (wrong user, or pw)', (done) => {
 var dataToTest = 'valueToTest';

 request(app) // SUPERTEST is request
 .post('/users/login')
 .send({email: users[1].email, password: users[1].password})
 .expect(200)
 .expect((res) => {
 expect(res.header['x-auth']).toExist();
 expect(res.body.myUser.email).toEqual(users[1].email);
 })
 .end((err, res) => {
 if (err) {
 return done(err);
 }
 User.findById(users[1]._id).then((user) => {
 expect(user.email).toEqual(users[1].email);
 expect(user.email).toEqual(res.body.myUser.email);
 expect(user.tokens[0].token).toEqual(res.headers['x-auth']);
 done();
 })
 .catch((error) => { done(error) });
 });
 });
 */


it('should reject invalid login (wrong password, tout court!)', (done) => {
    request(app)
    .post('/users/login')
    .send({email: users[1].email,
        password: users[1].password + 'BROKEN'})
    .expect(400)
    .expect((res) => {
    expect(res.headers['x-auth']).toNotExist();
})
.end((err, res) => {
    if (err) {
        return done(err);
    }
    User.findById(users[1]._id).then((user) => {
    expect(user.tokens.length).toBe(1);
/* (Above) Used to be 0, but now, with Authentication, we have added one token in SEED to our User # 2. This failed login leaves that one token intact. (A successful login results in a new token added to that array for what would be a total of two. Cheers.
 */
done();
})
.catch((err) => {
    if (err) {
        return done(err);
    }
});
});
});

it('should reject invalid login (user email not in database!) (plus, what the heck, bad password, too)', (done) => {
    var badPass = 'abc123';
var nobodyEmail = 'josephine222@example.com';

request(app) // SUPERTEST is request
    .post('/users/login')
    // .send({email: users[1].email, password: badPass}) // "error:  new Promise bcrypt compare failed" = Good!
    .send({email: nobodyEmail, password: badPass}) // "error:  error:  USER.JS: findByCredentials: No user found with that e-mail" = Good!
    .expect(400)
    // .end(done);
    .expect((res) => {
    expect(res.header['x-auth']).toNotExist();
// expect(res.body.myUser.email).toEqual(users[1].email);
})
.end((err, res) => {
    if (err) {
        return done(err);
    }
    // User.findById(users[1]._id).then((user) => {
    // User.findOne({email: users[1].email}).then((user) => {
    User.findOne({email: nobodyEmail}).then((user) => {
    if (!user) {
    console.log("WE FOUND NO USER W THAT EMAIL", nobodyEmail);
    /*
     error:  USER.JS: findByCredentials: No user found with that e-mail
     WE FOUND NO USER W THAT EMAIL josephine222@example.com
     */
    return done(err);
}
expect(user.email).toEqual(users[1].email); // boring.
// expect(user.email).toEqual(res.body.myUser.email);
// expect(user.tokens[0].token).toEqual(res.headers['x-auth']);

/*
 Instructor tested (having passed in good e-mail, but bad password):
 expect(user.tokens.length().toBe(0);
 */

done();
})
.catch((error) => { done(error) });

});
});


}); // /describe(POST /users/login)


describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
    // DELETE
    // Set x-auth equal to token
    // 200
    // Find user, verify that tokens array is 0 length

    var tokenThisTime = users[0].tokens[0].token;
    console.log("tokenThisTime: ", tokenThisTime);

    request(app)
        .delete('/users/me/token')
        .set('x-auth', tokenThisTime)
        .expect(200)
        .end((err, res) => {
        if (err) {
            return done(err);
        }
        User.findById(users[0]._id).then((user) => {
        expect(user.tokens.length).toBe(0);
    // return(done); // << Nope.
    done();
}).catch((error) => {
        return done(error);
});
});


});

}); // /describe DELETE /users/me/token
