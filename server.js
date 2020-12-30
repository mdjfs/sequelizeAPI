const express = require('express');
const bodyParser = require('body-parser');
const {User, Cameras, People, Detections, Faces} = require('./database/models/index');
const {auth, sign, initSecurity} = require("./security")
const fileUpload = require("express-fileupload");
const {initFaces, processFaces, registerFaces } = require("./faces");
const { Op } = require("sequelize");
const app = express();

app.use(bodyParser.json({ type: "application/json" }));
app.use(auth.unless({path: ["/token","/user/create"]}));
app.use(fileUpload({ limits: { fileSize: 50 * 1024 * 1024 } }));

const getTarget = (user) => {
    return { where: { id: user.id }};
}

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
    User.findOne(getTarget(req.currentUser))
    .then(data => res.status(200).send(data))
    .catch(err => res.status(500).send(err))
})
 
app.post("/user/update", (req, res) => {
    User.update(req.body, getTarget(req.currentUser))
    .then(data => res.status(200).send(data))
    .catch(err => res.status(500).send(err));
})

app.post("/user/delete", (req, res) => {
    User.destroy(getTarget(req.currentUser))
    .then(data =>  res.status(200).send(data))
    .catch(err => res.status(500).send(err))
});

app.post("/inspect", (req, res) => {
    if(req.files && Object.keys(req.files).length > 0){
        const promises = [];
        for(const cameraId of Object.keys(req.files)){
            promises.push(processFaces(cameraId, req.files[cameraId], req.currentUser))
        }
        Promise.all(promises)
        .then(_ => res.status(200).send(""))
        .catch(err => res.status(500).send(err));
    }else{
        res.status(404).send("No files to inspect.");
    }
});

app.get("/inspect", (req, res) => {
    const filter = (req.query.all) ? {} : {isRead: false};
    Detections.findAll({
        where:{
            UserId: req.currentUser.id,
            ...filter
        }
    }).then(detections => res.status(200).send(detections))
    .catch(err => res.status(500).send(err));
});

app.put("/inspect", (req, res) => {
    if(!req.body.ids) res.status(500).send("Needs specify ids to read.")
    else if(!Array.isArray(req.body.ids)) res.status(500).send("Ids needs to be an array.")
    else{
        Detections.update({ isRead: true }, {
            where: {
                UserId: req.currentUser.id,
                id:{
                    [Op.or]: req.body.ids
                }
            }
        }).then(_ => res.status(200).send(""))
        .catch(err => res.status(500).send(err));
    }
})

app.post("/camera", (req, res) => {
    Cameras.create({
        name: req.body.name,
        UserId: req.currentUser.id
    }).then(camera => res.status(200).send(camera))
    .catch(err => res.status(500).send(err));
});

app.get("/camera", (req, res) => {
    Cameras.findAll({
        where:{
            UserId: req.currentUser.id
        }
    }).then(cameras => res.status(200).send(cameras))
    .catch(err => res.status(500).send(err));
})

app.post("/know", (req, res) => {
    if(Object.keys(req.files).length > 0){
        const promises = [];
        for(const parameter of Object.keys(req.files)){
            const [firstName, lastName] = parameter.includes(",") ? parameter.split(",") : [parameter, ""];
            promises.push(registerFaces(firstName, lastName, req.files[parameter], req.currentUser));
        }
        Promise.all(promises)
        .then(_ => res.status(200).send(""))
        .catch(err => res.status(500).send(err));
    }else{
        res.status(404).send("No files to inspect.");
    }
});

app.get("/know", (req, res) => {
    const filter = req.query.id ? {id: req.query.id} : {}
    People.findAll({
        where:{
            UserId: req.currentUser.id,
            ...filter
        }
    }).then(people => {
        if(!req.query.photo) res.status(200).send(people)
        else if(req.query.id){
            Faces.findOne({
                where:{
                    PersonId: req.query.id
                }
            }).then(data => res.status(200).contentType(data.mimetype).send(data.image))
            .catch(err => res.status(500).send(err));
        }else res.status(500).send("You need select one id for a photo.");
    })
    .catch(err => res.status(500).send(err));
})

function initServer(){
    initSecurity((err) =>{
        if(!err){
            initFaces((err) => {
                if(!err){
                    app.listen(3000);
                }else console.error(err);
            })
        }else console.error(err);
    })
}

initServer();