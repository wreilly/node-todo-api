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
ES5: the authenticate function above (right hand side)
      is assigned to the key or var or property or whatever it is
     called 'authenticate' (left hand side) on the module.exports object. Gwoovy.
*/

// module.exports = { authenticate: authenticate };
// ES6 way:
module.exports = { authenticate };