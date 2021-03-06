require("./config/config");

var express = require("express");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var _ = require("lodash");
var bcrypt = require("bcrypt");

//Property of mongodb.ObjectID therefore ObjectID has to be the same  
var {ObjectID} = require("mongodb");
//To connect to a db
var {mongoose} = require("./db/mongoose");
var {Todo} = require("./Models/todo");
var {User} = require("./Models/user");
var {authenticate} = require("./middleware/authenticate");


var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());
// e.g. /todos?_method="DELETE"
app.use(methodOverride("_method"));

// app.get("/")
app.get("/", function(req, res){
    res.send("Todo Home Page");
});

app.post("/todos", authenticate, function(req, res){
    var todo = new Todo ({
        text: req.body.text,
        _creator: req.user._id
    });

    todo.save().then((docs)=>{
        res.send(docs);
    }, (e)=>{
        res.status(400).send(e);
    });
});

// DELETE /todos/id?_method=DELETE
app.delete("/todos/:id", authenticate, function(req, res){
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send("Invalid id!!");
    }
    Todo.findOneAndRemove({
        _id: id, 
        _creator: req.user._id
    }).then(function(deletedTodo){
        if(deletedTodo == null){
            return res.status(404).send();
        }
        res.status(200).send({deletedTodo});
    }, function(e){
        res.status(400).send();
    });
});

//Patch /todos/id patch vs put (Put requires the entity to be complete but patch does not)
app.patch("/todos/:id", authenticate, function(req, res){
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);
    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }

    if(_.isBoolean(body.completed)&& body.completed){
        body.completedAt = new Date().getTime();
    }
    Todo.findOneAndUpdate({
        _id:id, 
        _creator: req.user._id
    }, {$set:body}, {new: true}).then(function(todo){
        if(!todo){
            return res.status(404).send();
        }
        res.status(200).send({todo});
    }).catch(function(e){
        res.status(400).send();
    });
});

app.get("/todos", authenticate, function(req, res){
    Todo.find({
        _creator: req.user._id
    }).then((todos)=>{
        res.send({
            todos: todos
        });
    }, (e)=>{
        res.status(400).send(e);
    });
});

//GET /todos/{id}

app.get("/todos/:id", authenticate, function(req, res){
    
    var id = req.params.id;
    if(!ObjectID.isValid(id)){
        return res.status(404).send();
    }
    // res.send(req.params.id);
    Todo.findOne({
        _id:id,
        _creator: req.user._id
    })
        .then(function(todo){
            if(!todo){
                return res.status(404).send();
            }
            res.send({todo});
        }, function(e){
            res.status(400).send();
        });
});

//POST users
app.post("/users", function(req, res){

    var body = _.pick(req.body, ["email", "password"]);
    var user = new User(body);

    user.save().then(()=>{
        return user.generateAuthToken();
    }).then(function(token){
            res.header("x-auth", token).status(200).send(user);
    }).catch(function(e){
            res.status(400).send();
    });
});



app.get("/users/me", authenticate, function(req, res){
    res.send(req.user);
});
//POST /users/login
app.post('/users/login', (req, res) => {
  var body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password).then((user) => {
    return user.generateAuthToken().then((token) => {
      res.header('x-auth', token).send(user);
    });
  }).catch((e) => {
    res.status(400).send();
  });
});

//DELETE users/me/token
app.delete("/users/me/token", authenticate, (req, res)=>{
    req.user.removeToken(req.token).then(()=>{
        res.status(200).send();
    }, ()=>{
        res.status(400).send();
    });

});

app.listen(port, function(){
    console.log("Server Connected to " + port);
});

module.exports = {app};
