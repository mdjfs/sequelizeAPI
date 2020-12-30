module.exports = function(sequelize, {BLOB, STRING}){

    const faces = sequelize.define('Faces', {
        image: {
            type: BLOB,
            allowNull: false
        },
        mimetype: {
            type: STRING,
            allowNull: false
        }
    }); 

    faces.associate = function(models){
        faces.belongsTo(models.People);
        faces.belongsTo(models.Detections);
    }

    return faces;

}