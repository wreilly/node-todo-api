/**
 * Created by william.reilly on 12/30/16.
 */

// Refactored out of /server/server.js to this new /server/config/config.js

    /*
    Update. Further refactoring out (Lecture 101)
     // VALUES are now factored OUT of config.js (in Git) to config.json (NOT in Git)   added to .gitignore
     */


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

if (env === 'development' || env === 'test' ) {
    // NON Production:

    /*
    require .JSON automatically converts it to a JavaScript Object for you! :o)
     */

    // 'config' is whole JSON file:
    var config = require('./config.json');
    console.log("config: ", config);
    /*
     $ node server/config/config.js
     WR__ ENV! ***** env:  development
     config:  { test: { PORT: 3000, MONGODB_URI: 'mongodb://localhost:27017/TodoApp' },
     development:
     { PORT: 3000,
     MONGODB_URI: 'mongodb://localhost:27017/TodoAppTest' } }
     wreillymc-l:node-todo-api william.reilly$
     */

    // we use bracket notation to use a variable (env):
    // 'envConfig' is the environment-specific subset of that whole JSON file:
    var envConfig = config[env]; // grab either 'test' or 'development'

    console.log(Object.keys(envConfig)); // [ 'PORT', 'MONGODB_URI' ]
    Object.keys(envConfig).forEach((key) => {
        /*
        Nice: keys() spills you out an array of the keys to all key:val pairs in the Object. ok.
        Then array forEach lets us assign each val from those keys to a environment variable, of the same name as the key from the object. ok.
        So on the left, using bracket notation not dot, process.env.PORT for example
        And on the right, from envConfig Object (which, recall, is either the "test" or the "development" subset of our whole JSON), we apply the same key (E.g. PORT) to obtain its value (i.e. 3000) to assign to the env variable process.env.PORT = 3000).  O.K.!   Then same for MONGODB_URI.
         */
       process.env[key] = envConfig[key];
    });
}

/* HEROKU NOTES:
heroku config
heroku config:set
heroku config:get
heroku config:unset

 $ heroku config:set JWT_SECRET=_______________
 Setting JWT_SECRET and restarting ⬢ intense-bastion-42272... done, v11
 JWT_SECRET: crazysecretstuffPROD
 wreillymc-l:node-todo-api william.reilly$ heroku config
 === intense-bastion-42272 Config Vars
 JWT_SECRET:  ______________
 MONGODB_URI: mongodb://heroku_|||||||||||||||||.mlab.com:45208/heroku_j5vczb1f


 */

// VALUES are now factored OUT of config.js (in Git) to config.json (NOT in Git)
/*
if (env === 'development') {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoApp'; // <<< from /db/mongoose.js
    process.env.PORT =3000; // <<< from here in server.js
} else if (env === 'test') {
    process.env.PORT =3000;
    process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoAppTest'; // TEST database, kids.
}
*/

