var {User} = require("./../Models/user");

var authenticate = function(req, res, next){
     var token = req.header("x-auth");

    User.findByToken(token).then(function(user){
        if(!user){
            //Goes to the catch 
            return Promise.reject();
        }
        req.user = user;
        req.token = token;
        next();
    }).catch(function(e){
        //401 is authentication error
        res.status(401).send();
    });
};

module.exports  = {authenticate};