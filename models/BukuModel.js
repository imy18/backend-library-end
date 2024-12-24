// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Users from "./UserModel.js";
const {DataTypes} = Sequelize;

const Buku = db.define('buku', {

    id_buku: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    judul: {
        type: DataTypes.STRING,
        allowNull: false
    },

    penulis: {
        type: DataTypes.STRING
    },

    penerbit: {
        type: DataTypes.STRING
    },

    tahun_terbit: {
        type: DataTypes.INTEGER
    },

    dcc: {
        type: DataTypes.STRING
    },

    kategori: {
        type: DataTypes.STRING 
    },

    jumlah_buku: {
        type: DataTypes.TINYINT
    },

    bahasa: {
        type: DataTypes.STRING
    },

    lokasi_penyimpanan: {
        type: DataTypes.STRING
    },

    status_ketersediaan: {
        type: DataTypes.STRING
    },

    foto: {
        type: DataTypes.STRING 
    },
    
    kondisi: {
        type: DataTypes.STRING 
    },

    keterangan: {
        type: DataTypes.TEXT 
    },

    kelas: {
        type: DataTypes.STRING 
    }

}, {
    freezeTableName: true
});

// Relasi
Buku.belongsTo(Users, { 
    foreignKey: 'id_user' 
}); // Setiap buku dimiliki oleh satu user

Users.hasMany(Buku, { 
    foreignKey: 'id_user' 
}); // Seorang user dapat memiliki banyak buku

export default Buku;