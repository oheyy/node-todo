var {mongoose} = require("../db/mongoose");
var valdiator = require("validator");
var jwt = require("jsonwebtoken");
var _ = require("lodash");
var bcrypt = require("bcrypt");

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
//Mongoose Middleware 
userSchema.pre("save", function(next){
    var user = this;
    //Check if password is added/updated
    if(user.isModified("password")){
        bcrypt.genSalt(10, function(err, salt){
            bcrypt.hash(user.password, salt, function(err, hash){
                user.password = hash;
                next();
            });
        }); 
    }else{
        next();
    }
});

//Instance methods

//Find token 
userSchema.statics.findByToken = function(token){
    var User = this;
    var decoded;
    try{
        decoded = jwt.verify(token, "abc123");
    }catch(e){
        return Promise.reject();
    }

    return User.findOne({
        "_id": decoded._id,
        "tokens.token": token, 
        "tokens.access": "auth"
    });
}
//Automatically called Returns only _id and email in http post
userSchema.methods.toJSON = function(){
    var user = this;
    var userObject = user.toObject();

    return _.pick(userObject, ["_id", "email"]);
}

userSchema.methods.generateAuthToken = function(){
    //in the current user model whereby all except tokens are saved
    var user = this;
    var access  = "auth";
    var token = jwt.sign({_id: user._id.toHexString(), access}, "abc123");

    user.tokens.push({
        access, 
        token
    });
    //saves to db 
    return user.save().then(function(){
        //return token to pass to header as x-auth
        return token;
    });
};


var User = mongoose.model("user", userSchema);

module.exports = {User: User};