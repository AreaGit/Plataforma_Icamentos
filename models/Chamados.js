const Sequelize = require('sequelize');
const db = require('./db');
const Empresas = require('./Empresas'); // Correção aqui

const Chamados = db.define('chamados', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    empresa_id: {
        type: Sequelize.INTEGER,
        allowNull: false, // proprietário da assistência
    },

    customer_id: {
        type: Sequelize.STRING(100)
    },

    ordem_servico: {
        type: Sequelize.STRING(100),
        allowNull: false
    },

    descricao: {
        type: Sequelize.TEXT
    },

    endereco: {
        type: Sequelize.STRING(255),
        allowNull: false
    },

    tipo_icamento: {
        type: Sequelize.STRING(100),
        allowNull: false
    },

    produto: {
        type: Sequelize.ENUM('TELEVISOR', 'GELADEIRA'),
        allowNull: false
    },

    vt: {
        type: Sequelize.ENUM('Sim', 'Não'),
        allowNull: false
    },

    art: {
        type: Sequelize.ENUM('Sim', 'Não'),
        allowNull: false
    },

    art_nome: {
        type: Sequelize.STRING(255),
        allowNull: true
    },

    art_cpf: {
        type: Sequelize.STRING(255),
        allowNull: true
    },

    data_agenda: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },

    horario_agenda: {
        type: Sequelize.TIME,
        allowNull: false
    },

    proponenteId: {
        type: Sequelize.INTEGER
    },

    tipoProponente: {
        type: Sequelize.ENUM('cliente', 'empresa')
    },

    informacoes_uteis: {
        type: Sequelize.TEXT
    },

    anexos: {
        type: Sequelize.JSON
    },

    aprovacao_status: {
        type: Sequelize.ENUM("Pendente", "Aprovado", "Rejeitado"),
        defaultValue: "Pendente"
    },

    aprovacao_data: {
        type: Sequelize.DATE,
        allowNull: true
    },

    aprovador_id: {
        type: Sequelize.INTEGER,
        allowNull: true
    },

    nome_aprovador: {
        type: Sequelize.STRING,
        allowNull: true
    },

    criador_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    motivo_rejeicao: {
        type: Sequelize.TEXT,
        allowNull: true
    },

    status: {
        type: Sequelize.STRING(255),
        allowNull: false
    },

    nova_data_proposta: {
        type: Sequelize.DATE,
        allowNull: true
    },

    nfseUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
    },

    boletoUrl: {
        type: Sequelize.STRING(255),
        allowNull: true
    },

    boletoId: {
        type: Sequelize.STRING(100)
    },

    vencimentoBoleto: {
        type: Sequelize.DATE,
        allowNull: true
    },

    amount: {
        type: Sequelize.DECIMAL(10,2)
    },

    amount_company: {
        type: Sequelize.DECIMAL(10,2)
    }
});

// Relações corretas
Chamados.belongsTo(Empresas, {
    foreignKey: 'empresa_id',
    onDelete: 'CASCADE'
});

Empresas.hasMany(Chamados, {
    foreignKey: 'empresa_id'
});

// Sync
// Chamados.sync({ force: true });
Chamados.sync();

module.exports = Chamados;