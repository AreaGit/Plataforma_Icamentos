const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

// MODELS
const Empresas = require('../models/Empresas');
const Empresas_Icamento = require('../models/Empresas_Icamento');
const Chamados = require('../models/Chamados');
const Administradores = require('../models/Administradores');

// EMAIL
const nodemailer = require('nodemailer');

// WHATSAPP
const { client, sendMessage } = require('./api/whatsapp-web');
client.on('ready', () => {
  console.log('Cliente WhatsApp pronto para uso no admin.js');
});

// ======================================
// 🔧 FUNÇÕES AUXILIARES
// ======================================

async function enviarNotificacaoWhatsapp(destinatario, corpo) {
  return await sendMessage(destinatario, corpo);
}

async function enviarEmailNotificacao(destinatario, assunto, corpo) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: destinatario,
    subject: assunto,
    html: corpo,
  });
}

// ======================================
// 👤 ADMINISTRADORES (CRUD)
// ======================================

// Listar admins
app.get('/administradores', async (req, res) => {
  const admins = await Administradores.findAll({
    attributes: { exclude: ['senha'] }
  });
  res.json(admins);
});

app.get("/administradores/:id", async (req, res) => {
  const admin = await Administradores.findByPk(req.params.id);
  if(!admin) { return res.status(404).json({ message: "Admin não encontrado! " }) }

  res.json(admin);
});

// Criar admin
app.post('/administradores', async (req, res) => {
  const { nome, email, senha } = req.body;
  const hash = await bcrypt.hash(senha, 10);

  const admin = await Administradores.create({
    nome,
    email,
    senha: hash
  });

  res.json(admin);
});

// Atualizar admin
app.put('/administradores/:id', async (req, res) => {
  const admin = await Administradores.findByPk(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Admin não encontrado' });

  await admin.update(req.body);
  res.json(admin);
});

// Excluir admin
app.delete('/administradores/:id', async (req, res) => {
  await Administradores.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Administrador excluído' });
});

// ======================================
// 🏢 EMPRESAS
// ======================================

app.get('/empresas', async (_, res) => {
  const empresas = await Empresas.findAll({
    attributes: { exclude: ['senha'] }
  });
  res.json(empresas);
});

app.get('/empresas/:id', async (req, res) => {
  const empresa = await Empresas.findByPk(req.params.id);
  if (!empresa) return res.status(404).json({ message: 'Empresa não encontrada' });
  res.json(empresa);
});

app.post('/empresas', async (req, res) => {
  const empresa = await Empresas.create(req.body);
  res.json(empresa);
});

app.put('/empresas/:id', async (req, res) => {
  const empresa = await Empresas.findByPk(req.params.id);
  await empresa.update(req.body);
  res.json(empresa);
});

app.delete('/empresas/:id', async (req, res) => {
  await Empresas.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Empresa excluída' });
});

// ======================================
// 🏗️ EMPRESAS DE IÇAMENTO
// ======================================

app.get('/assistencias', async (_, res) => {
  const assistencias = await Empresas_Icamento.findAll();
  res.json(assistencias);
});

app.get("/assistencias/:id", async (req, res) => {
  const assistencia = await Empresas_Icamento.findByPk(req.params.id);
  if(!assistencia) { return res.status(404).json({ message: "Assistencia não encontrada! " }) }

  res.json(assistencia);
});

app.post('/assistencias', async (req, res) => {
  const assistencia = await Empresas_Icamento.create(req.body);
  res.json(assistencia);
});

app.put('/assistencias/:id', async (req, res) => {
  const assistencia = await Empresas_Icamento.findByPk(req.params.id);
  await assistencia.update(req.body);
  res.json(assistencia);
});

app.delete('/assistencias/:id', async (req, res) => {
  await Empresas_Icamento.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Assistência excluída' });
});

// ======================================
// 📞 CHAMADOS (CRUD + FILTROS)
// ======================================

app.get('/chamados', async (req, res) => {
  const { status, dataInicio, dataFim } = req.query;

  const where = {};
  if (status) where.status = status;
  if (dataInicio && dataFim) {
    where.data_agenda = { [Op.between]: [dataInicio, dataFim] };
  }

  const chamados = await Chamados.findAll({ where });
  res.json(chamados);
});

app.get('/chamados/:id', async (req, res) => {
  const chamado = await Chamados.findByPk(req.params.id);
  res.json(chamado);
});

app.put('/chamados/:id', async (req, res) => {
  const chamado = await Chamados.findByPk(req.params.id);
  await chamado.update(req.body);
  res.json(chamado);
});

app.put('/chamados/:id/status', async (req, res) => {
  const chamado = await Chamados.findByPk(req.params.id);
  chamado.status = req.body.status;
  await chamado.save();
  res.json({ message: 'Status atualizado' });
});

app.delete('/chamados/:id', async (req, res) => {
  await Chamados.destroy({ where: { id: req.params.id } });
  res.json({ message: 'Chamado excluído' });
});

module.exports = app;