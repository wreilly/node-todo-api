/**
 * Created by william.reilly on 12/22/16.
 */

/*
You don't "require()" in mocha (nor nodemon)
 "devDependencies": {
 "expect": "^1.20.2",
 "mocha": "^3.2.0",
 "nodemon": "^1.11.0",
 "supertest": "^2.0.1"
 }
 */
const expect = require('expect');
// !! N.B. We name the supertest stuff "request". Cheers.
const request = require('supertest');
const { ObjectID } = require('mongodb');

const { app } = require('./../server');
const { Todo } = require('./../models/todo');

/*
Because our testing includes ObjectIds - we need to explicitly create them here in our sort of dummied up test data (rather than let them be created dynamically by MongoDB etc. ...)
Hmm.
 */
const todos = [
    {
        _id: new ObjectID(),
        text: 'Test todo 01'
    },
    {
        _id: new ObjectID(),
        text: 'Test todo 02'
    },
    {
        _id: new ObjectID(),
        text: 'Test todo 03'
    },
    {
        _id: new ObjectID(),
        text: 'Test todo 04'
    },
]

// For testing, control what is in the database.
// HAD BEEN: Just empty it
// NOW NEEDED: Empty it, then fill with our known 4.
beforeEach((done) => {
    Todo.remove({}).then(
        () => { // Deletes ALL items
    return Todo.insertMany(todos);
}).then(
    () => done()
); // fire off done here
});




/* perfesser:
describe('POST /todos', () => {
    it('should create a new todo',(done) =>
{
    var text = 'Test todo text';

    request(app)
        .post('/todos')
        .send({text})
        .expect(200)
        .expect((res) => {
        expect(res.body.text
).
    toBe(text);
})
.
    end((err, res) => {
        if (err) {
            return done(err);
        }

        Todo.find().then((todos) => {
        expect(todos.length
).
    toBe(1);
    expect(todos[0].text).toBe(text);
    done();
}).
    catch((e) => done(e)
)
    ;
})
    ;
}
)
;
});
*/


/* *************** */

describe('POST /todos', () => {

    // ASYNC. Use done.
   it('should create a new todo', (done) => {
       var text = 'wot i got';
    console.log("Lisa? 3");
       // supertest in action! (whoa)
request(app)
    .post('/todos') // dumkopf! I had ('./todos') Ugh!
    // ES5: set 'text' from herein to 'text' on send object.
    .send({text: text})
    .expect(200)
    .expect((res) => {
    expect(res.body.text).toBe(text);
})
    .end((err, res) => {
    if (err) {
        console.log("Lisa? 4 err");      // return *stops* function execution
        return done(err);
    }
        console.log("Lisa? 2");
    // DATABASE STUFF:
    // ES5 way = Yep
    Todo.find({text: text}).then((todos) => { // fetch 'em all!
        // ES6 way = Also Yep
        // Todo.find({text}).then((todos) => { // fetch 'em all!
        console.log("Lisa?");
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
    it('should get all todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect((res) => {
            expect(res.body.todos.length).toBe(4);
        })
    .end(done);
});
});

describe('GET /todos/:id', () => {

    it('should return todo doc', (done) => {
        // supertest, go!
        request(app)
            .get(`/todos/${todos[0]._id.toHexString()}`)
            .expect(200)
            .expect((res) => {
           expect(res.body.todoDoc.text).toBe(todos[0].text)
        })
.end(done); // << Correct

//        expect(res.body.todoDoc.text).toBe('foobar'); //
// done(); // << No! My mistake of just RUNNING 'done()' - Tells me my test passed!! Hah. Even testing 'foobar'. Hmmph.

    }); // /it

it('should return 404 if todo not found', (done) => {
   // toHexString new ObjectId()  won't be in the collection
    // get a 404 back
    var justMadeId = new ObjectID(); // won't be found
    request(app)
    .get(`/todos/${justMadeId.toHexString()}`)
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
    request(app)
        .get(`/todos/${notEvenAnObjectId}`)
        .expect(404) // Test is: do I get a 404 back?
        .end(done);
});

}); // /describe :id
