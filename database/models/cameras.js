module.exports = function(sequelize, {STRING}){

    const cameras = sequelize.define('Cameras', {
        name: {
            type: STRING,
            allowNull: false
        }
    });

    cameras.associate = function(models){
        cameras.belongsTo(models.User);
        cameras.hasMany(models.Detections);
    }

    return cameras;
}