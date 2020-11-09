
const jwt = require('jsonwebtoken');
const fs = require('fs');
const sha256 = require('tiny-sha256');
const {User} = require('./database/models/index');
auth.unless = require('express-unless');

const privateKey = fs.readFileSync('./keys/pass');

const constraints = ["id", "username"];

function auth(req, res, next) {
    if (!req.header("Access-Token")) {
        res.status(401).send("401 Unauthorized.")
    }
    else {
        jwt.verify(req.header("Access-Token"), privateKey, { algorithms: ['RS256'] }, (err, target) => {
            if (err) {
                res.status(401).send(err);
            }
            else {
                User.findOne(target)
                    .then(user => {
                        if (user) {
                            req.auth = {
                                user: user,
                                target: target
                            };
                            next();
                        }
                        else {
                            res.status(500).send("Can't find the user.")
                        }
                    }).catch(err => res.status(500).send(err))
            }
        });
    }
}



function sign(body, callback) {
    var target = {
        where: {}
    };
    var find = false;
    for(var constraint of constraints)
        if(find = Object.keys(body).includes(constraint))
            target.where[constraint] = body[constraint];
    if(!find && body.password){
        callback("Can't find the user or you not set the password.");
    }
    else{
        User.findOne(target)
        .then(actualUser => {
            if(sha256(body.password) === actualUser.password){
                jwt.sign(target, privateKey, {algorithm: 'RS256'}, (err, token) => {
                    (err) ? callback(err) : callback(null,token);
                });
            }
            else{
                callback("Invalid password.");
            }
        }).catch(err => callback(err));
    }
}

module.exports = {
    auth: auth,
    sign: sign,
    constraints: constraints
}