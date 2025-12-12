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
    reset_token: {
        type: Sequelize.STRING(255),
    },
    reset_token_expiration: {
        type: Sequelize.DATE,
    },
    ativo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    realizar_chamados: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    },
    aprovar_chamados: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
    }
});

Administradores.sync();

module.exports = Administradores;