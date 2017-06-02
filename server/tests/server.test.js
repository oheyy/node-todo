var request = require('supertest');
var expect = require('expect');
var {ObjectId} = require("mongodb");

var {app} = require("./../server");
var {Todo} = require("./../Models/todo");
var {User} = require("./../Models/user");
var {todos, populateTodos, users, populateUsers} = require("./../db/seed/seed");

beforeEach(populateUsers);
beforeEach(populateTodos);
//Mocha
describe("POST /todos", function(){
    it("should create a new todo", function(done){
        var text = 'text todo text';
        //Send automatically parses as a JSON object
        //Request the express
        request(app)
            //goes to /todos
            .post("/todos")
            .set("x-auth", users[0].tokens[0].token)
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
            .set("x-auth", users[0].tokens[0].token)
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
            .set("x-auth", users[0].tokens[0].token)
            .expect(200)
            .expect(function(res){
                expect(res.body.todos.length).toBe(1);
            })
            .end(done);
    });

});

describe("GET /todos/id", function(){
    it("Should return a todo with corresponding id", function(done){
        request(app)
            .get("/todos/" + todos[0]._id.toHexString())
            .set("x-auth", users[0].tokens[0].token)
            .expect(200)
            .expect(function(res){
                //expect(res.body.todo.length).toBe(1);
                expect(res.body.todo.text).toBe(todos[0].text);
            })
            .end(done);
    });
        it("Should not return a todo with corresponding id", function(done){
        request(app)
            .get("/todos/" + todos[1]._id.toHexString())
            .set("x-auth", users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
    //id is the same format as the _id but none were found in the db
    it("Should return 404 if todo not found", function(done){
        var id = new ObjectId().toHexString();
        request(app)
        .get("/todos/" + id)
        .set("x-auth", users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });
    //the id is not same format as db _id
    it("Should return 404 if non object ids", function(done){
        var id = 123;
        request(app)
        .get("/todos/" + id)
        .set("x-auth", users[0].tokens[0].token)
        .expect(404)
        .end(done);
    });
});

describe("DELETE /todos/id", function() {
    it("Should delete the selected todo", function(done){
        request(app)
            .delete("/todos/" +  todos[0]._id)
            .set("x-auth", users[0].tokens[0].token)
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
            .set("x-auth", users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it("Should return 404 if ObjectID is invalid", function(done){
        var id = 12345;
        request(app)
            .delete("/todos/" + id)
            .set("x-auth", users[0].tokens[0].token)
            .expect(404)
            .end(done);
    });
});

describe("PATCH /todos/:id", function(){
    it("Should update the selected todo", function(done){
        var text = "test patch todos";
        request(app)
            .patch("/todos/" + todos[0]._id)
            .set("x-auth", users[0].tokens[0].token)
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
        .set("x-auth", users[1].tokens[0].token)
        .send({
            completed: false,
            text: text
        })
        .expect(200)
        .expect(function(res){
            expect(res.body.todo.text).toBe(text)
            expect(res.body.todo.completed).toBe(false)
            expect(res.body.todo.completedAt).toBe(333)
        })
        .end(done);
    });

});

describe("/POST /users", function(){
    it("Should create a new user", (done)=>{
        var email = "examplesserver@example.com";
        var password = "password!"
        request(app)
            .post("/users")
            .send({
                email,
                password
            })
            .expect(200)
            .expect((res)=>{
                expect(res.headers["x-auth"]).toExist();
                expect(res.body._id).toExist();
                expect(res.body.email).toBe(email)
            })
            .end((err, res)=>{
                if(err){
                    return done(err);
                }
                User.find({email}).then((users)=>{
                    expect(users).toExist();
                    expect(users[0].password).toNotBe(password);
                    // expect(users[0].email).toBe(email);
                    expect(users[0].email).toBeA("string");
                    done();
                }).catch((e)=>{
                    done(e);
                });
            })
    });

    it("Should return validation errors if request is invalid", (done)=>{
        request(app)
            .post("/users")
            .send({
                email: "error@example.com",
                password: "pa"
            })
            .expect(400)
            .end(done);
    })

    it("Should not create user if email is in use", (done)=>{
            request(app)
                .post("/users")
                .send({
                    email: "daniel@example.com",
                    password: "userOnePass"
                })
                .expect(400)
                .end(done);
    })
});
describe("GET /users/me", function(){
    it("Should retreive user if authenticated", (done)=>{
        request(app)
            .get("/users/me")
            .set("x-auth", users[0].tokens[0].token)
            .send({
                email: users[0].email,
                password: users[0].password
            })
            .expect(200)
            .expect((res)=>{
                expect(res.body._id).toBe(users[0]._id.toHexString());
                expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    });
    it("Should return 401 if not authenticated", (done)=>{
        request(app)
            .get("/users/me")
            .expect(401)
            .expect((res)=>{
                expect(res.body).toEqual({});
            })
            .end(done)
    })
});

describe("POST /users/login", ()=>{
    it("Should login", (done)=>{
        var email = "daniel@example.com";
        var password = "userOnePass";
        request(app)
            .post("/users/login")
            .send({
                email, 
                password
            })
            .expect(200)
            .expect((res)=>{
                expect(res.headers['x-auth']).toExist();
                expect(res.body.email).toBe(email);
                expect(res.body._id).toBe(users[0]._id.toHexString());
            })
            .end((err, res)=>{
                if(err){
                    return done(err)
                }
                User.findOne({email}).then((user)=>{
                    expect(user.tokens.length).toBe(2);
                    expect(user.tokens[1]).toInclude({
                        access: "auth",
                        token: res.headers["x-auth"]
                    })
                    done();
                }).catch((e)=>{
                    done(e);
                })
            })
    });

    it("Should not log in due to invalid password/email", (done)=>{
        request(app)
            .post("/users/login")
            .send({
                email: "test@example.com",
                password: "password!"
            })
            .expect(400)
            .expect((res)=>{
                expect(res.headers["x-auth"]).toNotExist();
            })
            .end((err, res)=>{
                if(err){
                    return done(err);
                }
                User.findById(users[0]._id).then((user)=>{
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch((e)=>{
                    done(e);
                })
            });
    });
});

describe("DELETE /users/me/token", ()=>{
    it("Should logout and delete the token", (done)=>{
        request(app)
            .delete("/users/me/token")
            .set("x-auth", users[0].tokens[0].token)
            .expect(200)
            .end((err, res)=>{
                if(err){
                    return done(err);
                }
                User.findById(users[0]._id).then((user)=>{
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((e)=>{
                    done(e);
                });
            })
    });
    
});