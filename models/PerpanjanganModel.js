// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Peminjaman from "./PeminjamanModel.js"; 
import Buku from "./BukuModel.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Perpanjangan = db.define('perpanjangan', {
    id_perpanjangan: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    id_peminjaman: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Peminjaman,
            key: 'id_peminjaman'
        }
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

    tanggal_perpanjangan: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
    },

    durasi_perpanjangan: {
        type: DataTypes.STRING,
        allowNull: false
    },

    status: {
        type: DataTypes.ENUM('menunggu persetujuan', 'disetujui'),
        allowNull: false,
        defaultValue: 'menunggu persetujuan'
    },

}, {
    freezeTableName: true
});

// Relasi
Perpanjangan.belongsTo(Peminjaman, {
    foreignKey: 'id_peminjaman',
    onDelete: 'CASCADE'
}); // Perpanjangan hanya terkait dengan satu peminjaman

Perpanjangan.belongsTo(Buku, {
    foreignKey: 'id_buku',
    onDelete: 'CASCADE'
}); // Setiap perpanjangan terkait dengan satu buku

Perpanjangan.belongsTo(Users, {
    foreignKey: 'id_user',
    onDelete: 'CASCADE'
}); // Setiap perpanjangan terkait dengan satu pengguna

export default Perpanjangan;