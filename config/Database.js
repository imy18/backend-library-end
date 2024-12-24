// Code was written by Muhammad Sindida Hilmy

import { Sequelize } from "sequelize";

const db = new Sequelize('smanbalibrary_db', 'root', '',{
    host: "localhost",
    dialect: "mysql"
});

export default db;