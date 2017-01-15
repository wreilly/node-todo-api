/**
 * Created by william.reilly on 1/3/17.
 */

// REFACTORED OUT from server.js

// NOT NEEDED .... const express = require('express');

const { User } = require('../models/user');


var authenticate = (req, res, next) => {

    var token = req.header('x-auth');

    User.findByToken(token).then((user) => {
        if(!user) {
        return Promise.reject("$$$ AUTHENTICATE.JS $$$ AUTHENTICATE REFACTOR: my custom err msg: good token, no user, solly");

    }
// NEW STUFF...
    /* ~14:02
     Instead of just sending back the user as response,
     we will 'modify the request object, such that we can use
     it (the modified request object) in the route down below...
     */
    /*
    Remark: Brilliant, you know, getting the whole USER object available on the passed-around REQ object.
    Pourquoi? Parce-que there comes a time (details below) when you just gotta have the User's _id, and, with this brilliant bit here, that tidbit of info goodness is sitting right on the REQ. No need to be going doing searches on the database of USERS & Etc. Bon.
     Details: GET /todos/:id  << We search the TODOS database, and we need to only get those items that were created by the logged-in user (based on that user's ObjectId). All we have is a token, hey? Do we need to also go to the USERS database to obtain that user ObjectId? NO! We do not. Why? Because right here at Authentication time we (brilliantly) thought ahead to STICK THE USER right on the REQ object. Now we have that User's ObjectId, ready to hand. Veddy nice.
     */
    // res.send(user); // << WAS
    req.user = user; // << NEW
    req.token = token; // << NEW

    // console.log("WR__ 777 $$$ AUTHENTICATE.JS $$$ req: ", req); // de trop
    // console.log("WR__ 777b $$$ AUTHENTICATE.JS $$$ req.user: ", req.user);
    // console.log("WR__ 777c $$$ AUTHENTICATE.JS $$$ req.token: ", req.token);


    next(); // MUST call

}).catch((error) => {
        res.status(401).send(error);
    // Here in catch(error), we do NOT call the next(). just saying.
});
};

/*
ES5: the authenticate function above (right hand side)
      is assigned to the key or var or property or whatever it is
     called 'authenticate' (left hand side) on the module.exports object. Gwoovy.
*/

// module.exports = { authenticate: authenticate };
// ES6 way:
module.exports = { authenticate };