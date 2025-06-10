const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Chamados = require('../models/Chamados');
const Empresas = require('../models/Empresas');
const Precos_Icamentos_Televisores = require('../models/Precos_Icamentos_Televisores.js');
const Precos_Icamentos_Geladeiras = require('../models/Precos_Icamentos_Geladeiras.js');
const { client, sendMessage } = require('./api/whatsapp-web');
const Empresas_Icamento = require('../models/Empresas_Icamento.js');
const moment = require('moment');
client.on('ready', () => {
  console.log('Cliente WhatsApp pronto para uso no chamados.js');
});

// Cria a pasta de uploads se não existir
const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

// Configuração do Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  }
});

const upload = multer({ storage });

// Funções
async function enviarNotificacaoWhatsapp(destinatario, corpo) {
  try {
      const response = await sendMessage(destinatario, corpo);
      console.log(`Mensagem de código de verificação enviada com sucesso para o cliente ${destinatario}:`, response);
      return response;
  } catch (error) {
      console.error(`Erro ao enviar mensagem para o cliente ${destinatario}:`, error);
      throw error;
  }
}

app.post('/calcular-valor', async (req, res) => {
  const { produto, uf, local, regiao, tipo_icamento, art, vt } = req.body;

  if (!produto || !uf || !local || !regiao || !tipo_icamento) {
    return res.status(400).json({ erro: 'Parâmetros obrigatórios ausentes' });
  }

  let model;
  if (produto === 'GELADEIRA') {
    model = Precos_Icamentos_Geladeiras;
  } else if (produto === 'TELEVISOR') {
    model = Precos_Icamentos_Televisores;
  } else {
    return res.status(400).json({ erro: 'Produto inválido' });
  }

  try {
    const preco = await model.findOne({ where: { uf, local, regiao } });
    if (!preco) return res.status(404).json({ erro: 'Preço não encontrado para os parâmetros fornecidos' });

    let valor = 0;
    const tipo = tipo_icamento.replace('/', '_');

    if (tipo === 'SUBIDA') {
      valor += parseFloat(preco.icamento_para_instalacao || 0);
    } else if (tipo === 'DESCIDA') {
      valor += parseFloat(preco.icamento_para_descida || 0);
    } else if (tipo === 'SUBIDA_DESCIDA') {
      valor += parseFloat(preco.icamento_para_instalacao || 0);
      valor += parseFloat(preco.icamento_para_descida || 0);
    }

    if (art === 'SIM') valor += parseFloat(preco.art || 0);
    if (vt === 'SIM') valor += parseFloat(preco.vt || 0);

    return res.json({ valor: valor.toFixed(2) });
  } catch (e) {
    console.error('Erro ao calcular valor:', e);
    return res.status(500).json({ erro: 'Erro no servidor', detalhe: e.message });
  }
});

app.post('/criar-chamado', upload.array('anexos'), async (req, res) => {
  try {
    const {
      empresa_id,
      ordem,
      descricao,
      endereco,
      tipo_icamento,
      produto,
      vt,
      art,
      data_agendada,
      horario_agenda,
      informacoes_uteis
    } = req.body;

    // Converter data do formato DD/MM/YYYY para ISO (YYYY-MM-DD)
    const dataFormatada = moment(data_agendada, 'DD/MM/YYYY', true);
    if (!dataFormatada.isValid()) {
      return res.status(400).json({ success: false, message: 'Data agendada inválida.' });
    }

    const agora = moment();
    const diffHoras = dataFormatada.diff(agora, 'hours');
    if (diffHoras < 48) {
      return res.status(400).json({
        success: false,
        message: 'A data agendada deve ter no mínimo 48 horas a partir de agora.'
      });
    }

    const arquivos = req.files?.map(file => `/uploads/${file.filename}`) || [];

    const novoChamado = await Chamados.create({
      empresa_id: empresa_id,
      ordem_servico: ordem,
      descricao,
      endereco,
      tipo_icamento,
      produto: produto,
      vt: vt,
      art: art,
      data_agenda: dataFormatada.toDate(), // já convertido para formato válido
      horario_agenda: horario_agenda,
      informacoes_uteis,
      anexos: arquivos,
      status: "Aguardando"
    });

    const empresa = await Empresas.findByPk(empresa_id);
    const telefone = empresa?.telefone;
    const nome = empresa.nome;
    let link = "a definir";

    let mensagem = `Olá! ${nome} Tudo certo?\nSeu chamado de içamento ${novoChamado.id} foi aberto com sucesso no nosso Portal Exclusivo para as Assistências Customer Services Samsung. ✅\n\n📌 Você poderá acompanhar os próximos passos pelo portal: ${link}\nAlém disso, você também receberá as atualizações por aqui no WhatsApp.\n\nQualquer dúvida, é só nos chamar por aqui.\nObrigado!\nPortal de Içamento SAMSUNG
    `;

    await enviarNotificacaoWhatsapp(telefone, mensagem);

    const empresa_icamento = await Empresas_Icamento.findByPk(1);
    const telefone_empresa_icamento = empresa_icamento.telefone;

    let mensagem_empresa_icamento = `Olá, tudo bem?
    Há um novo agendamento de içamento disponível para você no Portal de Içamentos - Samsung. 📦🔧

    📌 Por favor, acesse o portal para verificar os detalhes e confirmar o atendimento:
    ${link}

    Em caso de dúvidas, estamos à disposição por aqui.
    Obrigado!
    Portal de Içamento SAMSUNG`;

    await enviarNotificacaoWhatsapp(telefone_empresa_icamento, mensagem_empresa_icamento);

    res.status(201).json({ success: true, chamado: novoChamado });
  } catch (err) {
    console.error('Erro ao criar chamado:', err);
    res.status(500).json({ success: false, message: 'Erro interno ao criar chamado.' });
  }
});

app.get('/chamados/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const chamado = await Chamados.findAll({ where: { empresa_id: id } });

    if (!chamado) {
      return res.status(404).json({ message: 'chamado não encontrada' });
    }

    res.json(chamado);
  } catch (error) {
    console.error('Erro ao buscar chamado por ID:', error);
    res.status(500).json({ message: 'Erro ao buscar chamado' });
  }
});

app.get('/chamado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chamado = await Chamados.findByPk(id);

    if (!chamado) {
      return res.status(404).json({ message: 'Chamado não encontrado' });
    }

    res.json(chamado);
  } catch (error) {
    console.error('Erro ao buscar detalhes do chamado:', error);
    res.status(500).json({ message: 'Erro ao buscar detalhes do chamado' });
  }
});

app.put('/chamado/:id/propor-data', async (req, res) => {
  const { novaDataHora, userId, tipo } = req.body;
  const { id } = req.params;

  if (!novaDataHora) {
    return res.status(400).json({ error: 'Nova data/hora é obrigatória' });
  }

  try {
    const chamado = await Chamados.findByPk(id);

    if (!chamado) {
      return res.status(404).json({ error: 'Chamado não encontrado' });
    }

    if (["Agendado", "Em Execução", "Finalizado", "Cancelado", "No-show"].includes(chamado.status)) {
      return res.status(403).json({ error: 'Chamado não pode mais ser remarcado' });
    }

    chamado.nova_data_proposta = new Date(novaDataHora);
    chamado.proponenteId = userId;
    chamado.tipoProponente = tipo;
    await chamado.save();

    return res.status(200).json({ message: 'Nova data proposta com sucesso' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno' });
  }
});

app.put('/chamado/:id/aceitar-proposta', async (req, res) => {
  const { id } = req.params;
  const { userId, tipo } = req.body;

  try {
    const chamado = await Chamados.findByPk(id);

    // Só o usuário que NÃO propôs pode aceitar
    if (chamado.proponenteId === userId && chamado.tipoProponente === tipo) {
      return res.status(403).json({ error: 'Você não pode aceitar sua própria proposta' });
    }

    if (!chamado || !chamado.nova_data_proposta) {
      return res.status(400).json({ error: 'Não há proposta para aceitar' });
    }

    const novaData = new Date(chamado.nova_data_proposta);
    chamado.data_agenda = novaData.toISOString().split('T')[0];
    chamado.horario_agenda = novaData.toISOString().split('T')[1].slice(0, 5);
    chamado.nova_data_proposta = null;

    await chamado.save();

    return res.status(200).json({ message: 'Nova data aceita e atualizada' });
  } catch (err) {
    return res.status(500).json({ error: 'Erro interno' });
  }
});

module.exports = app;