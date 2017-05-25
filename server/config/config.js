//If using mocha test NODE_ENV is test if heroku production then else development
var env = process.env.NODE_ENV|| "development";

if(env === "test"){
    process.env.PORT = 3000;
    process.env.MONGODB_URI = "mongodb://localhost:27017/TodoAppTest"
}
else if(env === "development"){
    process.env.PORT = 3000;
    process.env.MONGODB_URI = "mongodb://localhost:27017/TodoApp"
}
