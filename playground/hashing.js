/**
 * Created by william.reilly on 12/30/16.
 */
const { SHA256 } = require('crypto-js');

const jwt = require('jsonwebtoken');

var jwtData = {
    id: 10
};

// *** Pass your SECRET  ('123abc')
var jwtToken = jwt.sign(jwtData, '123abc');
// jwt.verify
console.log("JWT SIGN jwtToken: ", jwtToken);
/*
 JWT SIGN jwtToken:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTQ4MzEzMzg1N30.wyshk6igq1hz4Rpd2jZr3WW0GvSomFjtjYp6BRrUQUE
 */

// *** Pass your SECRET  ('123abc')
var jwtDecoded = jwt.verify(jwtToken, '123abc');
console.log("JWT VERIFY DECODED jwtDecoded: ", jwtDecoded);
/*
 $ node playground/hashing.js
 JWT SIGN jwtToken:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAsImlhdCI6MTQ4MzEzNDExOX0.PmUu5yGMaTuhm8cxlIntWWnbXD4M6ywKYeqASkztles

 JWT VERFIFY DECODED jwtDecoded:  { id: 10, iat: 1483134119 } // 47.02987439751395 YEARS ! (Since 1970)
 */

var message = "I am ze new user 3";
var hash = SHA256(message).toString();
console.log(`Message: ${message}`);
console.log(`Hash: ${hash}`);

/*
 $ node playground/hashing.js
 Message: I am ze new user 3
 Hash: 10cb3de5aac8448f06cf4c4b037b3f8fec49b109e551282e188bf00038525b37
 */

var data = {
    id: 4
};

// What we send back to the user:
var token = {
    data,
    hash: SHA256(JSON.stringify(data) + 'somesecretsalt').toString() // hashed value of that data
}
console.log("***** Hmm. 01 Token we send to client: ", token);

// BAD GUY
// MAN IN THE MIDDLE TRYING TO HACK:
// N.B. BAD GUY LACKS THE SALT! (Has pepper, apparently.)
token.data.id = 5; // <<< Bad guy change from 4 to 5
// token.hash = SHA256(JSON.stringify(token.data) + 'badguyguessatsecretsalt').toString(); // <<<< GUESS at SALT! (Hah!)
token.hash = SHA256(JSON.stringify(token.data) + 'somesecretsalt').toString(); // <<<< Bad Guy CORRECT GUESS at SALT! (Oh no!)
// token.hash = SHA256(JSON.stringify(token.data)).toString(); // <<<< No SALT!



console.log("****** Hmm. 02 Token we are getting back from  client: ", token);


// SALT
// password string PLUS (random) SALT
// Hash the above and it'll be UNIQUE
// Not able to be regenerated.

var resultHash = SHA256(JSON.stringify(token.data) + 'somesecretsalt').toString();

console.log("***** Hmm. 03 resultHash Token we are processing, from what was sent back to us (using our tippity-top secret SALT: ", resultHash);

/*
In sum, we really do need to keep that SALT secret, on our system, not getting out to the Bad Guys.
 */

if (resultHash === token.hash) {
    // then O.K.
    console.log("O.K. Data was not changed. Good.");
} else {
    console.log("Uh-oh. Data was changed. Don't trust.");
}