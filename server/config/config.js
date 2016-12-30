/**
 * Created by william.reilly on 12/30/16.
 */

// Refactored out of /server/server.js to this new /server/config/config.js

// var env = process.env.NODE_ENV || 'development'; // I don't need this extra '||' OR bit, as my environment variable is set in my ~/.profile  :o)
    // And, when we run our Mocha tests, that environment variable is overwritten to be 'test'.
    // Hmm, and what happens if after I run a couple of tests, I wish to return to just running in development? node server/server.js
    // Hmm.
    // O.K. - TURNS OUT THIS WORKS FINE - not an issue. Bueno.
var env = process.env.NODE_ENV;

// LET'S SEE!
console.log("WR__ ENV! ***** env: ", env);

/*
 Mine is set, via ~/.profile, to:
 NODE_ENV=development

 Heroku = already set by them:
 NODE_ENV=production

 Mocha = set in our package.json "scripts.test" line:
 NODE_ENV=test
 */

/* ENVIRONMENT SETTING BIZ:
 (No need to explicitly address 'production', Heroku takes care of it for you ...)
 */

if (env === 'development') {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoApp'; // <<< from /db/mongoose.js
    process.env.PORT =3000; // <<< from here in server.js
} else if (env === 'test') {
    process.env.PORT =3000;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoAppTest'; // TEST database, kids.
}

