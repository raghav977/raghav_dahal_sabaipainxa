const {DataTypes} = require("sequelize");

const bcrypt = require("bcrypt")

const sequelize = require("../config/db")

const User = sequelize.define('user', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            len: [3, 50]
        }
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone_number: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profile_picture: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: process.env.DEFAULT_PROFILE_PIC || '/images/default-profile.jpg'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    name:{
        type: DataTypes.STRING,
        allowNull: true,
    },
    municipal_code: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'municipals', // table name
        key: 'municipal_code'          // referenced column in municipals table
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    },
    blocked_reason:{
        type: DataTypes.STRING,
        maxLength: 255,
        allowNull: true,
    }
}, {
    paranoid: true, 
    timestamps: true 
});


User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});


User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});


module.exports = User;
