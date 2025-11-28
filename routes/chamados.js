// routes/chamados.js
const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { Op } = require('sequelize');
require('dotenv').config();

const Chamados = require('../models/Chamados');
const Empresas = require('../models/Empresas');
const Empresas_Icamento = require('../models/Empresas_Icamento.js');
const EmpresasIcamento = require('../models/Empresas_Icamento.js');
const Administradores = require('../models/Administradores.js');

const Precos_Icamentos_Televisores = require('../models/Precos_Icamentos_Televisores.js');
const Precos_Icamentos_Geladeiras = require('../models/Precos_Icamentos_Geladeiras.js');
const Precos_Icamentos_Televisores_Empresas = require('../models/Precos_Icamentos_Televisores_Empresas.js');
const Precos_Icamentos_Geladeiras_Empresas = require('../models/Precos_Icamentos_Geladeiras_Empresas.js');

const { client, sendMessage } = require('./api/whatsapp-web');
const { cobrancaBoletoAsaas, agendarNfsAsaas, emitirNfs, consultarNf } = require('./api/asaas');

client.on('ready', () => {
  console.log('Cliente WhatsApp pronto para uso no chamados.js');
});

// ============ UPLOADS ============

const uploadPath = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_').replace(/[^\w.\-]/g, '');
    const unique = `${Date.now()}-${safeName}`;
    cb(null, unique);
  }
});

const upload = multer({ storage });

// ============ HELPERS ============

async function enviarNotificacaoWhatsapp(destinatario, corpo) {
  if (!destinatario) {
    console.warn('Tentativa de envio WhatsApp sem telefone.');
    return;
  }
  try {
    const response = await sendMessage(destinatario, corpo);
    console.log(`Mensagem enviada para ${destinatario}:`, response);
    return response;
  } catch (error) {
    console.error(`Erro ao enviar mensagem para ${destinatario}:`, error);
    // não lanço erro pra não quebrar o fluxo principal
  }
}

function dataMais35DiasFormatada(data_agendada) {
  const [dia, mes, ano] = data_agendada.split('/');
  const data = new Date(`${ano}-${mes}-${dia}T00:00:00`);

  if (isNaN(data.getTime())) {
    throw new Error('Data inválida fornecida para dataMais35DiasFormatada');
  }

  data.setDate(data.getDate() + 35);
  return data.toISOString().split('T')[0];
}

function isSim(value) {
  if (!value) return false;
  const v = String(value).trim().toLowerCase();
  return v === 'sim';
}

// ============ ROTAS ============

// Cálculo de valor
app.post('/calcular-valor', async (req, res) => {
  try {
    const { produto, uf, local, regiao, tipo_icamento, art, vt } = req.body;

    if (!produto || !uf || !local || !regiao || !tipo_icamento) {
      return res.status(400).json({ erro: 'Parâmetros obrigatórios ausentes' });
    }

    let model;
    let model2;
    if (produto === 'GELADEIRA') {
      model = Precos_Icamentos_Geladeiras;
      model2 = Precos_Icamentos_Geladeiras_Empresas;
    } else if (produto === 'TELEVISOR') {
      model = Precos_Icamentos_Televisores;
      model2 = Precos_Icamentos_Televisores_Empresas;
    } else {
      return res.status(400).json({ erro: 'Produto inválido' });
    }

    const preco = await model.findOne({ where: { uf, local, regiao } });
    const preco2 = await model2.findOne({ where: { uf, local, regiao } });

    if (!preco) {
      return res.status(404).json({ erro: 'Preço não encontrado para os parâmetros fornecidos' });
    }
    if (!preco2) {
      return res.status(404).json({ erro: 'Preço para empresa não encontrado para os parâmetros fornecidos' });
    }

    let valor = 0;
    let valor2 = 0;
    const tipo = tipo_icamento.replace('/', '_');

    if (tipo === 'SUBIDA') {
      valor += parseFloat(preco.icamento_para_instalacao || 0);
      valor2 += parseFloat(preco2.icamento_para_instalacao || 0);
    } else if (tipo === 'DESCIDA') {
      valor += parseFloat(preco.icamento_para_descida || 0);
      valor2 += parseFloat(preco2.icamento_para_descida || 0);
    } else if (tipo === 'SUBIDA_DESCIDA') {
      valor += parseFloat(preco.icamento_para_instalacao || 0);
      valor += parseFloat(preco.icamento_para_descida || 0);

      valor2 += parseFloat(preco2.icamento_para_instalacao || 0);
      valor2 += parseFloat(preco2.icamento_para_descida || 0);
    }

    if (isSim(art)) {
      valor += parseFloat(preco.art || 0);
      valor2 += parseFloat(preco.art || 0);
    }
    if (isSim(vt)) {
      valor += parseFloat(preco.vt || 0);
      valor2 += parseFloat(preco.vt || 0);
    }

    return res.json({
      valor: valor.toFixed(2),
      valor2: valor2.toFixed(2)
    });
  } catch (e) {
    console.error('Erro ao calcular valor:', e);
    return res.status(500).json({ erro: 'Erro no servidor', detalhe: e.message });
  }
});

// Criar chamado
app.post('/criar-chamado', upload.array('anexos'), async (req, res) => {
  try {
    // ======================================
    // 🔐 AUTENTICAÇÃO UNIFICADA
    // ======================================
    const userRole        = req.cookies.authTipo;      
    const empresaIdCookie = req.cookies.authEmpresaId;  
    const adminId         = req.cookies.authAdminId; 
    const autorizadoId    = req.cookies.authUsuarioAutorizadoId;

    let criador_id = null;
    let empresa_id = Number(empresaIdCookie);

    if (userRole === "admin") {
      criador_id = adminId;
      // Admin não pertence a empresa → precisa receber empresa_id via body (ou definir regra)
      if (!empresa_id) {
        return res.status(400).json({
          success: false,
          message: "Admin precisa especificar empresa_id."
        });
      }
    } 
    else if (userRole === "empresa") {
      // Empresa é a proprietária do chamado
      criador_id = empresa_id;
    } 
    else if (userRole === "autorizado") {
      criador_id = autorizadoId;
    }

    console.log("AUTH →", { userRole, empresa_id, criador_id });

    if (!userRole || !empresa_id || !criador_id) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado ou cookies inválidos."
      });
    }

    // ======================================
    // 📌 CAMPOS DO FORMULÁRIO
    // ======================================
    const {
      customer_asaas_id,
      ordem,
      descricao,
      endereco,
      tipo_icamento,
      produto,
      vt,
      art,
      art_nome,
      art_cpf,
      data_agendada,
      horario_agenda,
      informacoes_uteis,
      amount,
      amount_company
    } = req.body;

    // ======================================
    // ⚠️ VALIDAÇÕES
    // ======================================
    if (!ordem || !tipo_icamento || !produto || !vt || !art || !data_agendada || !horario_agenda) {
      return res.status(400).json({ success: false, message: "Preencha todos os campos obrigatórios." });
    }

    const empresaProprietaria = await Empresas.findByPk(empresa_id);
    if (!empresaProprietaria) {
      return res.status(400).json({ success: false, message: "Empresa proprietária não encontrada." });
    }

    // Validar data DD/MM/YYYY
    const dataFormatada = moment(data_agendada, "DD/MM/YYYY", true);
    if (!dataFormatada.isValid()) {
      return res.status(400).json({ success: false, message: "Data agendada inválida." });
    }

    const agora = moment();
    const diffHoras = dataFormatada.diff(agora, "hours");

    if (diffHoras < 48) {
      return res.status(400).json({
        success: false,
        message: "A data agendada deve ter no mínimo 48 horas."
      });
    }

    // ENUMs
    const produtoFinal = produto.toUpperCase();
    const vtFinal  = vt.toUpperCase()  === "SIM" ? "Sim" : "Não";
    const artFinal = art.toUpperCase() === "SIM" ? "Sim" : "Não";

    // ======================================
    // 📎 ANEXOS
    // ======================================
    const arquivos = req.files?.map(file => `/uploads/${file.filename}`) || [];

    // ======================================
    // 📝 CRIAR CHAMADO
    // ======================================
    const novoChamado = await Chamados.create({
      empresa_id,
      criador_id,
      aprovador_id: empresaProprietaria.id,
      aprovacao_status: "Pendente",
      status: "Aguardando Aprovação",

      customer_id: customer_asaas_id,
      ordem_servico: ordem,
      descricao,
      endereco,
      tipo_icamento,
      produto: produtoFinal,
      vt: vtFinal,
      art: artFinal,
      art_nome,
      art_cpf,
      data_agenda: dataFormatada.toDate(),
      horario_agenda,
      informacoes_uteis,
      anexos: arquivos,

      nfseUrl: "a emitir",
      boletoUrl: "a emitir",
      boletoId: "a emitir",
      vencimentoBoleto: "a emitir",

      amount: Number(amount),
      amount_company: Number(amount_company)
    });

    // ======================================
    // 📲 NOTIFICAÇÃO WHATSAPP AO APROVADOR
    // ======================================
    const link = `portalicamento.com.br/samsung/chamado-detalhes?id=${novoChamado.id}`;

    await enviarNotificacaoWhatsapp(
      empresaProprietaria.telefone,
      `Olá, ${empresaProprietaria.nome}
Há um novo chamado aguardando sua aprovação:

📌 Chamado: ${novoChamado.id}
➡ Acesse: ${link}

Portal de Içamento Samsung`
    );

    // ======================================
    // 🔔 NOTIFICAR EMPRESA DE IÇAMENTO (ID=1)
    // ======================================
    if (empresa_id !== 1) {
      const empresaIcamento = await Empresas_Icamento.findByPk(1);
      if (empresaIcamento) {
        // Ative se quiser notificar empresa 1
        // await enviarNotificacaoWhatsapp(empresaIcamento.telefone, `Novo chamado criado: ${link}`);
      }
    }

    return res.status(201).json({ success: true, chamado: novoChamado });

  } catch (err) {
    console.error("Erro ao criar chamado:", err);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao criar chamado."
    });
  }
});

// Listar chamados por empresa
app.get('/chamados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chamados = await Chamados.findAll({ where: { empresa_id: id } });
    return res.json(chamados);
  } catch (error) {
    console.error('Erro ao buscar chamados:', error);
    res.status(500).json({ message: 'Erro ao buscar chamados' });
  }
});

// Chamados para Administradores
app.get("/chamados", async (req, res) => {
    const adminId = req.cookies?.authAdminId;

    if (!adminId) {
        return res.status(403).json({ error: "Acesso restrito a administradores" });
    }

    const chamados = await Chamados.findAll({
        order: [['id', 'DESC']]
    });

    res.json(chamados);
});

// Detalhe do chamado
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

  // --------------------------------------------------
  // Propor nova data
  // body: { novaDataHora, userId, tipo } 
  // tipo: 'cliente' | 'autorizado' | 'icamento' (aceita variações 'empresa' para compatibilidade)
  // --------------------------------------------------

app.put("/chamado/:id/propor-data", async (req, res) => {
    try {
        const chamadoId = req.params.id;
        const { novaDataHora, userId, tipo } = req.body;

        if (!novaDataHora || !userId || !tipo) {
            return res.status(400).json({ error: "Dados incompletos." });
        }

        const chamado = await Chamados.findByPk(chamadoId);
        if (!chamado) return res.status(404).json({ error: "Chamado não encontrado." });

        // Só permite proposta quando está em “Aguardando”
        if (String(chamado.status).toLowerCase() !== "aguardando") {
            return res.status(400).json({ error: "Só é possível propor nova data quando o chamado está em Aguardando." });
        }

        // Validação de data
        const novaData = new Date(novaDataHora);
        if (isNaN(novaData.getTime())) {
            return res.status(400).json({ error: "Data inválida." });
        }

        const agora = new Date();
        if (novaData <= agora) {
            return res.status(400).json({ error: "A nova data deve ser futura." });
        }

        // Monta data/hora atual agendada
        const dataAtualAgenda = new Date(`${chamado.data_agenda}T${chamado.horario_agenda}`);

        const horasDiff = (dataAtualAgenda - agora) / (1000 * 60 * 60);
        if (horasDiff <= 24) {
            return res.status(400).json({ error: "Remarcação só é permitida com mais de 24h de antecedência." });
        }

        // Normaliza tipo
        const tipoNorm = String(tipo).toLowerCase();

        // // Valida permissão
        // const permitido = await validarPermissao(chamado, userId, tipoNorm);
        // if (!permitido.ok) {
        //     return res.status(403).json({ error: permitido.msg });
        // }

        // Grava proposta
        chamado.nova_data_proposta = novaData;
        chamado.proponenteId = userId;
        chamado.tipoProponente = tipoNorm;
        // chamado.status = "Aguardando Confirmação";

        await chamado.save();

        return res.json({
            success: true,
            message: "Proposta enviada com sucesso. Aguardando resposta da outra parte.",
            proposta: chamado.nova_data_proposta
        });

    } catch (err) {
        console.error("Erro propor nova data:", err);
        res.status(500).json({ error: "Erro interno." });
    }
});
  // --------------------------------------------------
  // Responder proposta (aceitar | recusar)
  // body: { acao: 'aceitar'|'recusar', userId, tipo }
  // --------------------------------------------------

app.put("/chamado/:id/responder-proposta", async (req, res) => {
    try {
        const chamadoId = req.params.id;
        const { acao, userId, tipo } = req.body;

        console.log(req.body)

        if (!acao || !userId || !tipo) {
            return res.status(400).json({ error: "Dados incompletos." });
        }

        const chamado = await Chamados.findByPk(chamadoId);
        if (!chamado) return res.status(404).json({ error: "Chamado não encontrado." });

        // if (String(chamado.status).toLowerCase() !== "aguardando confirmação") {
        //     return res.status(400).json({ error: "Não há proposta pendente." });
        // }

        if (!chamado.nova_data_proposta) {
            return res.status(400).json({ error: "Nenhuma proposta existe." });
        }

        const tipoNorm = String(tipo).toLowerCase();

        // Proponente não pode responder à própria proposta
        if (Number(chamado.proponenteId) === Number(userId) && chamado.tipoProponente === tipoNorm) {
            return res.status(403).json({ error: "Você não pode responder à sua própria proposta." });
        }

        // Valida permissão
        // const permitido = await validarPermissao(chamado, userId, tipoNorm);
        // if (!permitido.ok) {
        //     return res.status(403).json({ error: permitido.msg });
        // }

        const acaoNorm = acao.toLowerCase();

        if (acaoNorm === "aceitar") {

            const nova = new Date(chamado.nova_data_proposta);
            const iso = nova.toISOString();
            const [data, hora] = iso.split("T");

            chamado.data_agenda = data;
            chamado.horario_agenda = hora.slice(0, 5);

            chamado.nova_data_proposta = null;
            chamado.proponenteId = null;
            chamado.tipoProponente = null;

            chamado.status = "Aguardando";

            await chamado.save();

            return res.json({ success: true, message: "Proposta aceita. Data atualizada." });

        } else if (acaoNorm === "recusar") {

            chamado.nova_data_proposta = null;
            chamado.proponenteId = null;
            chamado.tipoProponente = null;

            chamado.status = "Aguardando";

            await chamado.save();

            return res.json({ success: true, message: "Proposta recusada." });

        } else {
            return res.status(400).json({ error: "Ação inválida." });
        }

    } catch (err) {
        console.error("Erro responder proposta:", err);
        res.status(500).json({ error: "Erro interno." });
    }
});

// Aprovar chamado
app.put("/chamado/:id/aprovar", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const chamado = await Chamados.findByPk(id);
    if (!chamado) return res.status(404).json({ error: "Chamado não encontrado" });

    // VERIFICA SE É ADMINISTRADOR
    const admin = await Administradores.findByPk(adminId);
    if (!admin) {
      return res.status(403).json({ error: "Somente administradores podem aprovar chamados." });
    }

    if (chamado.aprovacao_status !== "Pendente") {
      return res.status(400).json({ error: "Chamado já foi analisado." });
    }

    // Atualiza status do chamado
    chamado.aprovacao_status = "Aprovado";
    chamado.aprovacao_data = new Date();
    chamado.status = "Aguardando"; // Empresa de icamento agora deve assumir

    await chamado.save();

    // =================================================
    // NOTIFICAÇÕES POR WHATSAPP
    // =================================================

    // Link direto para visualização
    const link = `portalicamento.com.br/samsung/chamado-detalhes?id=${chamado.id}`;

    // --- 1️⃣ Notificar quem abriu o chamado (assistência / empresa proprietária)
    const assistencia = await Empresas.findByPk(chamado.empresa_id);
    if (assistencia && assistencia.telefone) {
      
      const msgAssistencia = `Olá! ${assistencia.nome}\nTudo certo?\nSeu chamado de Içamento ${chamado.id} foi aberto com sucesso no nosso Portal Exclusivo para as Assistências Customer Services Samsung. ✅\n\n📌 Você poderá acompanhar os próximos passos pelo portal: ${link}\nAlém disso, você também receberá as atualizações por aqui no WhatsApp.\n\nQualquer dúvida, é só nos chamar por aqui.\nObrigado!\nPortal de Içamento SAMSUNG`;

      try {
        await enviarNotificacaoWhatsapp(assistencia.telefone, msgAssistencia);
      } catch (e) {
        console.error("Falha ao notificar assistência:", e);
      }
    }

    // --- 2️⃣ Notificar empresa de içamento (sempre ID = 1)
    const empresaIcamento = await Empresas_Icamento.findByPk(1);

    if (empresaIcamento && empresaIcamento.telefone) {
      
      const msgIcamento = `Olá, tudo bem?
      Há um novo agendamento de içamento disponível para você no Portal de Içamentos - Samsung. 📦🔧

      📌 Por favor, acesse o portal para verificar os detalhes e confirmar o atendimento:
      ${link}
      
      Em caso de dúvidas, estamos à disposição por aqui.
      Obrigado!
      Portal de Içamento SAMSUNG`;

      try {
        await enviarNotificacaoWhatsapp(empresaIcamento.telefone, msgIcamento);
      } catch (e) {
        console.error("Falha ao notificar empresa de içamento:", e);
      }
    }

    return res.json({ success: true, message: "Chamado aprovado com sucesso!" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno", detalhe: err.message });
  }
});

// Rejeitar chamado
app.put("/chamado/:id/rejeitar", async (req, res) => {
  const { id } = req.params;
  const { aprovadorId, motivo } = req.body;

  try {
    const chamado = await Chamados.findByPk(id);
    if (!chamado) return res.status(404).json({ error: "Chamado não encontrado" });

    if (chamado.aprovacao_status !== "Pendente") {
      return res.status(400).json({ error: "Chamado já foi analisado." });
    }

    const aprovadorIdNum = Number(aprovadorId);
    if (Number.isNaN(aprovadorIdNum)) {
      return res.status(400).json({ error: "aprovadorId inválido" });
    }

    if (chamado.aprovador_id !== aprovadorIdNum) {
      return res.status(403).json({ error: "Você não tem permissão para rejeitar este chamado" });
    }

    chamado.aprovacao_status = "Rejeitado";
    chamado.aprovacao_data = new Date();
    chamado.motivo_rejeicao = motivo;
    chamado.status = "Cancelado";

    await chamado.save();

    return res.json({ success: true, message: "Chamado rejeitado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno", detalhe: err.message });
  }
});

module.exports = app;