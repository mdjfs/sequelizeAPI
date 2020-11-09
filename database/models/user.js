
const sha256 = require('tiny-sha256');

module.exports = function(sequelize, {STRING}){


    const user = sequelize.define('User', {
        firstName: {
            type: STRING,
            allowNull: false
        },
        lastName: {
            type: STRING,
            allowNull: false
        },
        username: {
            type: STRING,
            unique: true,
            allowNull: false
        },
        email: {
            type: STRING,
            unique: true,
            allowNull: false
        },
        password: {
            type: STRING,
            set(value){
                this.setDataValue("password", sha256(value))
            }
        }
    });
    return user;

}
