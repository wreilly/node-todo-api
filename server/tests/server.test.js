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
        text: 'Test todo 02',
        completed: true,
        completedAt: 1000
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
).toBe(text);
})
.end((err, res) => {
        if (err) {
            return done(err);
        }

        Todo.find().then((todos) => {
        expect(todos.length).toBe(1); // <<<< Because for this test our db was empty, we added 1, find() returns all which is 1.
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




// /////////////////////////////////

describe('DELETE /todos/:id', () => {

    /* We'll delete this one (from array todos above):
     {
     _id: new ObjectID(),
     text: 'Test todo 02'
     },
     */

    it('should remove a todo', (done) => {

    // Hmm, (above) we have an actual ObjectId (not just a String). So:
        // http://mongodb.github.io/node-mongodb-native/2.2/api/ObjectID.html#toHexString
    var hexStringId = todos[1]._id.toHexString(); // 24 chars long String

    // Recall, 'request' is our SUPERTEST guy:
    request(app)
        .delete(`/todos/${hexStringId}`)
        // NO NO NO:        .then((todo), () => {
        .expect(200)
        .expect((res) => {
        expect(res.body.todo._id
)
.toBe(hexStringId);
})
  .end((err, res) => {
            if(err) {
                console.log('Hmm. API error', err);
                return done(err);
            }
            // challenge:
        // // Now, QUERY the DATABASE to ensure doc was deleted. Do so using findById; test: .toNotExist()
        // .catch(e) ...

        Todo.findById(hexStringId).then((todo) => {
            // success getting to db at least
        // Our test is that, at this point, the doc does not exist
        expect(todo).toNotExist();
        done();

            }, (err) => {
              // error
        console.log('Hmmm # 2. Mongoose driver to database Error: ', err);
        return done();
    }) // /.then
}); // /.end

/* NO NO NO:
    }, (err) => {
        expect(404);
        done();
    }); // /then
*/

}); // /it(remove one)


it('should return 404 if todo not found', (done) => {
    // Hmm, just make one up? (It won't be in the db)
    var myHexId = new ObjectID().toHexString();

    request(app)
        .delete(`/todos/${myHexId}`)
        .expect(404)
        .end(done);

}); // /it(404 not found)



it('should return 404 if ObjectId is invalid', (done) => {

    var myBadIdString = 'notanobjectid123';

    request(app)
        .delete(`/todos/${myBadIdString}`)
        .expect(404)
        .end(done);

}); // /it(404 invalid)


}); // /describe(DELETE)



// //////// PATCH ////////////

describe('PATCH /todos/:id', () => {
   it('should update the todo', (done) => {
       // grab id of first item
    var idFor01 = todos[0]._id; // e.g. whatever the new ObjectID() yielded
    console.log('idFor01 is ', idFor01); // 586550fc7977115839d89e6e

    var textWrote = "Something I wrote in a test. 01.";


    // update text, set completed true
    request(app)
        .patch(`/todos/${idFor01}`)
        .send({
            text: textWrote, // was something else; we're updating!
            completed: true // was false
        })
        .expect(200) // same as next lines:
        .expect((resfoo) => { // Call the 'res' (response) whatever you like ...
        expect(resfoo.status).toBe(200);
    })
        .expect((res) => {
        expect(res.body.todo.text).toBe(textWrote);
        expect(res.body.todo.completed).toBe(true);
    expect(res.body.todo.completedAt).toExist();
    expect(res.body.todo.completedAt).toBeA('number'); // https://www.npmjs.com/package/expect

    })
    .end(done);

    // http://mongoosejs.com/docs/api.html#model_Model.findByIdAndUpdate
/* NO NO NO. YEESH.
    Todo.findByIdAndUpdate(idFor01,
        {
            $set: {
                text: "Something I wrote in a test. 01.",
                completed: true
            },

        },
        {
            new: true
        },
        (returnedDoc) => {
        console.log('Woot. returnedDoc: ', returnedDoc);
    }

    ); // /findByIdAndUpdate()
*/

    // get 200


    // expect((res) => ... that text is changed; completed is true; completedAt is a number .toBe()

}); // /it should update the todo...


// ====================================
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
    .expect(404)
    .end(done);

}); // /it 404 ObjectId

it('should return 404 for NON-ObjectId', (done) => {
    var myNonObjectId = '45';

    request(app)
        .patch(`/todos/${myNonObjectId}`)
        .expect(404)
        .end(done)

}); // /it 404 NON-ObjectId


}); // /describe(PATCH)