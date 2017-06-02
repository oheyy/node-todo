//If using mocha test NODE_ENV is test if heroku production then else development
var env = process.env.NODE_ENV|| "development";

if(env === 'development'|| env === 'test'){
    //Converts from JSON to js object
    var config = require("./config.json");
    //To use variable to access use bracket either test/development
    var envConfig = config[env];
    //Returns as an array
    Object.keys(envConfig).forEach((key)=>{
        //Key == PORT && MONGODB_URI && JWT_SECRET
        process.env[key] = envConfig[key];
    });

}
