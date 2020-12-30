const faces = require("mdjfs-face-api");
const { Op } = require("sequelize");
const {Faces, People, Detections, Cameras} = require('./database/models/index');

const api = new faces();

function initFaces(callback){
    api.init().then(_ => callback(null)).catch(err => callback(err));
}

async function getKnowFaces(currentUser){
    const persons = await People.findAll({
        where:{
            UserId: currentUser.id
        }
    });
    const faces = await Faces.findAll({
        where:{
            PersonId:{
                [Op.or]:persons.map((value) => value.id)
            }
        }
    })
    return faces.map(value => value.dataValues);
}

async function processFaces(cameraId, images, currentUser){
    const cam = await Cameras.findOne({
        where:{
            id: cameraId,
            UserId: currentUser.id
        }
    });
    if(!cam) throw "No camera provided.";
    const knowFaces = await getKnowFaces(currentUser);
    for(var i=0; i<images.length; i++){
        const photos = await api.getFaces([images[i].data]);
        for(const faces of photos){
            for(const face of faces){
                var matchId = null;
                for(const knowFace of knowFaces){
                    var isMatched = await api.compareFaces(knowFace.image, face);
                    if(isMatched) matchId = knowFace.PersonId;
                }
                const detection = await Detections.create({
                    PersonId: matchId,
                    UserId: currentUser.id,
                    CameraId: cameraId
                });
                await Faces.create({
                    DetectionId: detection.id,
                    PersonId: matchId,
                    image: face,
                    mimetype: images[i].mimetype
                });
            }
        }

    }
}

async function registerFaces(firstName, lastName, images, currentUser){
    const person = await People.create({
        firstName: firstName,
        lastName: lastName,
        UserId: currentUser.id
    });
    const buffers = images.map((value) => value.data);
    const photos = await api.getFaces(buffers);
    for(var i=0; i<photos.length; i++){
        for(const face of photos[i]){
            await Faces.create({
                image: face,
                mimetype: images[i].mimetype,
                PersonId: person.id
            })
        }
    }
}

module.exports = {initFaces, processFaces, registerFaces};