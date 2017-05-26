var {mongoose} = require("../db/mongoose");
var valdiator = require("validator");
var jwt = require("jsonwebtoken");
var _ = require("lodash");

var userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1, 
        unique: true,
        validate: {
            isAsync: false,
            validator: valdiator.isEmail,
            message: "Email is not a valid"
        }
    },
    password:{
        type: String,
        required: true, 
        minlength: 6
    }, 
    tokens: [{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required:true
        }
    }]
});

//Instance methods
//Returns only _id and email in http post
userSchema.methods.toJSON = function(){
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ["_id", "email"]);
}

userSchema.methods.generateAuthToken = function(){
    var user = this;
    var access  = "auth";
    var token = jwt.sign({_id: user._id.toHexString(), access}, "abc123").toString();

    user.tokens.push({
        access, 
        token
    });
    return user.save().then(function(){
        return token;
    })
};


var User = mongoose.model("user", userSchema);

module.exports = {User: User};