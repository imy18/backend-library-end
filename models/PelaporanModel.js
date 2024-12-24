// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Buku from "./BukuModel.js"; 
import Users from "./UserModel.js"; 
import Peminjaman from "./PeminjamanModel.js";
const {DataTypes} = Sequelize;

const Pelaporan = db.define('pelaporan', {

    id_pelaporan: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_buku: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Buku,
            key: 'id_buku'
        }
    },

    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Users, 
            key: 'id_user'
      }
    },

    id_peminjaman: {  
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Peminjaman, 
            key: 'id_peminjaman'
        }
    },

    tanggal: {
        type: DataTypes.DATE,
        allowNull: false
    },

    kategori: {
        type: DataTypes.ENUM('hilang', 'rusak'),
        allowNull: false
    },

    jumlah_buku: {
        type: DataTypes.TINYINT,
        allowNull: false
    },

    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: false
    },

}, {
    freezeTableName: true
});

// Relasi
Pelaporan.belongsTo(Buku, { 
    foreignKey: 'id_buku', 
    as: 'buku' 
}); // Setiap laporan dibuat berdasarkan satu buku

Pelaporan.belongsTo(Users, { 
    foreignKey: 'id_user', 
    as: 'user' 
}); // Setiap laporan diuat oleh satu user

Pelaporan.belongsTo(Peminjaman, { 
    foreignKey: 'id_peminjaman', 
    as: 'peminjaman' 
}); // Setiap laporan dibuat berdasarkan satu peminjaman

export default Pelaporan;