// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";
import db from "../config/Database.js";
const { DataTypes } = Sequelize;

const Kunjungan = db.define('kunjungan', {
    id_kunjungan: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nama_pengunjung: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    tanggal_kunjungan: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW,
    },
    status_kunjungan: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "masuk", 
    }
}, {
    freezeTableName: true
});

export default Kunjungan;