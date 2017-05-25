var {mongoose} = require("../db/mongoose");


var userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1 
    }
});

var User = mongoose.model("user", userSchema);

module.exports = {User: User};