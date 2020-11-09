const express = require('express');
const bodyParser = require('body-parser');
const {User} = require('./database/models/index');
const {auth, sign, constraints} = require("./security")

const app = express();

app.use(bodyParser.json({ type: "application/json" }));
app.use(auth.unless({path: ["/token","/user/create"]}))

app.post("/token", (req, res) => {
    sign(req.body, (err, token) => {
        (err) ? res.status(500).send(err) : res.status(200).send(token)
    })
})

app.post("/user/create", (req, res) => {
    User.create(req.body)
    .then(data => res.status(200).send(data))
    .catch(err => res.status(500).send(err))
})

app.post("/user/read", (req, res) => {
    User.findOne(req.auth.target)
    .then(data => res.status(200).send(data))
    .catch(err => res.status(500).send(err))
})
 
app.post("/user/update", (req, res) => {
    var immutable = false;
    for(var constraint of constraints)
        if(req.auth.target.where[constraint] !== req.body[constraint] && req.body[constraint])
            immutable = true;
    if(!immutable)
        User.update(req.body, req.auth.target)
        .then(data => res.status(200).send(data))
        .catch(err => res.status(500).send(err));
    else
        res.status(500).send(`Cannot modify these propiertes: ${constraints.toString()}`);
})

app.post("/user/delete", (req, res) => {
    User.destroy(req.auth.target)
    .then(data => res.status(200).send(data))
    .catch(err => res.status(500).send(err))
})

app.listen(3000)