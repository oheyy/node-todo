var request = require('supertest');
var expect = require('expect');
var {ObjectId} = require("mongodb");

var {app} = require("./../server");
var {Todo} = require("./../Models/todo");

const todos = [{
        _id: new ObjectId(),
        text: "First test todo"
    },{
        _id: new ObjectId(),
        text: "Second test todo"
    }
];

beforeEach((done)=>{
    Todo.remove({}).then(function(){
        return Todo.insertMany(todos);
    }).then(function(){
        done();
    });
});
//Mocha
describe("POST /todos", function(){
    it("should create a new todo", function(done){
        var text = 'text todo text';
        //Send automatically parses as a JSON object
        //Request the express
        request(app)
            //goes to /todos
            .post("/todos")
            //Sends a text file as json
            .send({text})
            //expect statuscode to be 200
            .expect(200)
            //expect the text in the body received from /todos to be text
            .expect(function(res){
                expect(res.body.text).toBe(text);
            })
            //custom test
            .end(function(err, res){
                if(err){
                    return done(err);
                }
                //Checks db for the length to be of 1 meaning only 1 entry 
                Todo.find({text}).then(function(todos){
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch(function(e){ 
                    done(e)
                });
            });
        
    });

    it("should not create todo with invalid body data", (done)=>{
        request(app)
            .post("/todos")
            .send({})
            .expect(400)
            .end(function(err, res){
                if(err){
                    return done(err);
                }

                Todo.find().then(function(todos){
                    expect(todos.length).toBe(2);
                    done();
                }).catch(function(e){
                    done(e)
                });
            });
    })
});

describe("GET /todos", function(){
    it("Should return a list of todos", (done)=>{
        request(app)
            .get("/todos")
            .expect(200)
            .expect(function(res){
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });

});

describe("GET /todos/id", function(){
    it("Should return a todo with corresponding id", function(done){
        request(app)
            .get("/todos/" + todos[0]._id)
            .expect(200)
            .expect(function(res){
                //expect(res.body.todo.length).toBe(1);
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });
    //id is the same format as the _id but none were found in the db
    it("Should return 404 if todo not found", function(done){
        var id = new ObjectId().toHexString();
        request(app)
        .get("/todos/" + id)
        .expect(404)
        .end(done);
    });
    //the id is not same format as db _id
    it("Should return 404 if non object ids", function(done){
        var id = 123;
        request(app)
        .get("/todos/" + id)
        .expect(404)
        .end(done);
    });
});

describe("DELETE /todos/id", function() {
    it("Should delete the selected todo", function(done){
        request(app)
            .delete("/todos/" +  todos[0]._id)
            .expect(200)
            .expect(function(res){
                expect(res.body.deletedTodo.text).toBe(todos[0].text);
            })
            .end(function(err, res){
                if(err){
                    return done(err);
                }
                Todo.findById(todos[0]._id).then(function(todo){
                    expect(todo).toNotExist();
                    done();
                }).catch(function(e){ 
                    done(e)
                });
            });
    });

    it("should return 404 if todo not found", function(done){
        var id = new ObjectId().toHexString();
        request(app)
            .delete("/todos/" + id)
            .expect(404)
            .end(done);
    });

    it("Should return 404 if ObjectID is invalid", function(done){
        var id = 12345;
        request(app)
            .delete("/todos/" + id)
            .expect(404)
            .end(done);
    });
});

describe("PATCH /todos/:id", function(){
    it("Should update the selected todo", function(done){
        var text = "test patch todos";
        request(app)
            .patch("/todos/" + todos[0]._id)
            .send({
                completed: true,
                text: text
            })
            .expect(200)
            .expect(function(res){
                expect(res.body.todo.text).toBe(text)
                expect(res.body.todo.completed).toBe(true)
                expect(res.body.todo.completedAt).toBeA("number")
            })
            .end(done);
    });
    it("Should clear the CompleteAt when todo is not completed", function(done){
    var text = "test patch todos/id";
    request(app)
        .patch("/todos/" + todos[1]._id)
        .send({
            completed: false,
            text: text
        })
        .expect(200)
        .expect(function(res){
            expect(res.body.todo.text).toBe(text)
            expect(res.body.todo.completed).toBe(false)
            expect(res.body.todo.completedAt).toNotExist()
        })
        .end(done);
    });

});