var express = require("express");
var bodyParser = require("body-parser");

var {mongoose} = require("./db/mongoose");
var {Todo} = require("./Models/todo");
var {user} = require("./Models/user");


var app = express();
app.use(bodyParser.json());

// app.get("/")

// app.get("/todo")

app.post("/todos", function(req, res){
    var todo = new Todo ({
        text: req.body.text
    });

    todo.save().then((docs)=>{
        res.send(docs);
    }, (e)=>{
        res.status(400).send(e);
    });
});

app.listen(3000, () => {
    console.log("Server Connected");
});

