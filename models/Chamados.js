const Sequelize = require('sequelize');
const db = require('./db');
const EmpresasIcamento = require('./Empresas_Icamento');

const Chamados = db.define('chamados', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    empresa_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
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
        type: Sequelize.ENUM('Televisor', 'Geladeira'),
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
    data_agenda: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    horario_agenda: {
        type: Sequelize.TIME,
        allowNull: false
    },
    nova_data_proposta: {
        type: Sequelize.DATE,
        allowNull: true
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
        type: Sequelize.JSON,
    },
    status: {
        type: Sequelize.ENUM('Aguardando', 'Agendamento', 'Agendado', 'Em Execução', 'Finalizado', 'No-Show', 'Cancelado'),
        defaultValue: "Aguardando",
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
        type: Sequelize.INTEGER
    }
});

// Relacionamentos
Chamados.belongsTo(EmpresasIcamento, {
  foreignKey: 'empresa_id',
  onDelete: 'CASCADE'
});

EmpresasIcamento.hasMany(Chamados, {
  foreignKey: 'empresa_id'
});

// CRIAR TABELA
//Chamados.sync({ force: true });
Chamados.sync();

module.exports = Chamados;