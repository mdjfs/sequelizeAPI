

module.exports = function(sequelize, {BOOLEAN}){

    const detections = sequelize.define('Detections', {
        isRead: {
            type: BOOLEAN,
            defaultValue: false
        }
    });

    detections.associate = function(models){
        detections.belongsTo(models.People);
        detections.belongsTo(models.User);
        detections.belongsTo(models.Cameras);
        detections.hasMany(models.Faces);
    }

    return detections;
}