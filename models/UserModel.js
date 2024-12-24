// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const {DataTypes} = Sequelize;
const Users = db.define('users', {

    id_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },

    name:{
        type: DataTypes.STRING,
        allowNull: false
    },

    email:{
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },

    kelas: {
        type: DataTypes.STRING
    },

    no_telepon: {
        type: DataTypes.STRING
    },


    angkatan: {
        type: DataTypes.INTEGER
    },

    role: {
        type: DataTypes.STRING
    },

    jenis_kelamin: {
        type: DataTypes.ENUM('Laki-laki', 'Perempuan')
    },

    foto: {
        type: DataTypes.STRING
    },

    password:{
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8,]
        }
    },

    refresh_token:{
        type: DataTypes.TEXT
    },
},{
    freezeTableName: true
});

export default Users;