// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";
import db from "../config/Database.js";
const {DataTypes} = Sequelize;

const Kritiksaran = db.define('kritiksaran', {

    id_kritikSaran: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },

    tanggal: {
        type: DataTypes.DATE,
        allowNull: false
    },

    subjek: {
        type: DataTypes.STRING,
        allowNull: false
    },

    isi: {
        type: DataTypes.TEXT,
        allowNull: false
    },

}, {
    freezeTableName: true
});

export default Kritiksaran;