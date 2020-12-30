
module.exports = function(sequelize, {STRING}){

    const people = sequelize.define('People', {
        firstName: {
            type: STRING,
            allowNull: false
        },
        lastName: {
            type: STRING,
            allowNull: false
        }
    });

    people.associate = function(models){
        people.belongsTo(models.User);
        people.hasMany(models.Faces);
        people.hasMany(models.Detections);
    }

    return people;
}