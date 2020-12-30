
const jwt = require('jsonwebtoken');
const fs = require('fs');
const sha256 = require('tiny-sha256');
const {User} = require('./database/models/index');
auth.unless = require('express-unless');

let privateKey;

function initSecurity(callback){
    fs.readFile('./keys/pass', (err, data) => {
        if(!err){
            privateKey = data;
            callback(null);
        }else callback(err);
    })
}

function auth(req, res, next) {
    if (!req.header("Access-Token")) {
        res.status(401).send("401 Unauthorized.")
    }
    else {
        jwt.verify(req.header("Access-Token"), privateKey, { algorithms: ['RS256'] }, (err, user) => {
            if (err) {
                res.status(401).send(err);
            }
            else if(user.username) {
                User.findOne({
                    where: {
                        username: user.username
                    }
                }).then(user => {
                        if (user) {
                            req.currentUser = user.dataValues;
                            next();
                        }
                        else {
                            res.status(500).send("Invalid user or password.")
                        }
                }).catch(err => res.status(500).send(err))
            }else{
                res.status(500).send("Can't find the user.")
            }
        });
    }
}



function sign(body, callback) {
    if(body.username && body.password){
        User.findOne({
            where: {
                username: body.username
            }
        }).then(actualUser => {
            if(sha256(body.password) === actualUser.password){
                jwt.sign(actualUser.dataValues, privateKey, {algorithm: 'RS256'}, (err, token) => {
                    (err) ? callback(err) : callback(null,token);
                });
            }
            else{
                callback("Invalid user or password.");
            }
        }).catch(err => callback(err));
    }
    else{
        callback("Can't find the user or you not set the password.");
    }
}

module.exports = {auth, sign, initSecurity};