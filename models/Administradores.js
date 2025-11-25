const Sequelize = require("sequelize");
const db = require("./db");

const Administradores = db.define('administradores', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nome: {
        type: Sequelize.STRING(100),
        allowNull: false
    },
    email: {
        type: Sequelize.STRING(100),
        unique: true,
        allowNull: false
    },
    telefone: {
        type: Sequelize.STRING(50),
        allowNull: true
    },
    senha: {
        type: Sequelize.STRING(255),
        allowNull: false
    },
    ativo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    }
});

Administradores.sync();

module.exports = Administradores;