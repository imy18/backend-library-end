// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";
import db from "../config/Database.js";
import Buku from "./BukuModel.js";
import Users from "./UserModel.js";

const { DataTypes } = Sequelize;

const Peminjaman = db.define('peminjaman', {
    id_peminjaman: {
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

    tanggal_peminjaman: {
        type: DataTypes.DATE,
        allowNull: false
    },

    tanggal_pengembalian: {
        type: DataTypes.DATE,
        allowNull: false
    },

    tanggal_pengembalian_aktual: {
        type: DataTypes.DATE
    },

    tanggal_perpanjangan: {
        type: DataTypes.DATE
    },

    status_peminjaman: {
        type: DataTypes.ENUM('sedang dipinjam', 'sudah dikembalikan', 'menunggu persetujuan'),
        allowNull: false,
        defaultValue: 'menunggu persetujuan'
    },

    denda: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },

    jumlah_pinjaman: {
        type: DataTypes.TINYINT,
        defaultValue: 1
    },

    jumlah_pengembalian_terlambat: {
        type: DataTypes.TINYINT,
        defaultValue: 0
    },

    catatan: {
        type: DataTypes.TEXT
    }
}, {
    freezeTableName: true
});

// Relasi
Peminjaman.belongsTo(Users, { 
    foreignKey: 'id_user'
 }); // Setiap peminjaman dimiliki oleh satu anggota

Users.hasMany(Peminjaman, { 
    foreignKey: 'id_user' 
}); // Seorang anggota dapat melakukan banyak peminjaman

Peminjaman.belongsTo(Buku, { 
    foreignKey: 'id_buku' 
}); // Setiap peminjaman berkaitan dengan satu buku

Buku.hasMany(Peminjaman, { 
    foreignKey: 'id_buku' 
}); // Sebuah buku dapat dipinjam beberapa kali

export default Peminjaman;