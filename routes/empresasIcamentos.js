const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Chamados = require('../models/Chamados');
const Chamados_Finalizados = require('../models/Chamados_Finalizados');
const { Op } = require('sequelize');
const { client, sendMessage } = require('./api/whatsapp-web');
const { cobrancaBoletoAsaas, agendarNfsAsaas, emitirNfs, consultarNf } = require('./api/asaas');
const Empresas = require('../models/Empresas');
client.on('ready', () => {
  console.log('Cliente WhatsApp pronto para uso no empresasIcamentos.js');
});

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

// Configuração do destino e nome dos arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/finalizacoes/'); // Crie essa pasta se não existir
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

app.get('/empresa-icamentos/chamados', async (req, res) => {
  try {
    const { status, dataInicio, dataFim } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (dataInicio && dataFim) {
      where.data_agenda = {
        [Op.between]: [dataInicio, dataFim]
      };
    } else if (dataInicio) {
      where.data_agenda = {
        [Op.gte]: dataInicio
      };
    } else if (dataFim) {
      where.data_agenda = {
        [Op.lte]: dataFim
      };
    }

    const chamados = await Chamados.findAll({
      where,
      order: [['data_agenda', 'DESC']]
    });

    res.json(chamados);
  } catch (err) {
    console.error('Erro ao listar chamados filtrados:', err);
    res.status(500).json({ message: 'Erro ao listar chamados' });
  }
});

app.get('/empresa-icamentos/chamado/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const chamado = await Chamados.findByPk(id);

    if (!chamado) return res.status(404).json({ message: 'Chamado não encontrado' });

    res.json(chamado);
  } catch (error) {
    console.error('Erro ao buscar chamado:', error);
    res.status(500).json({ message: 'Erro ao buscar chamado' });
  }
});

app.get('/download-anexo', (req, res) => {
  const fileName = req.query.file;
  const filePath = path.join(__dirname, 'uploads', path.basename(fileName));

  res.download(filePath, err => {
    if (err) {
      console.error('Erro ao fazer download do arquivo:', err);
      res.status(500).send('Erro ao baixar arquivo.');
    }
  });
});

app.put('/empresa-icamentos/chamado/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(req.params, req.body)

    const permitido = ["Aguardando", "Agendamento", "Agendado", "Em Execução", "Finalizado", "No-show", "Cancelado"];
    if (!permitido.includes(status)) {
      return res.status(400).json({ message: "Status inválido" });
    }

    const chamado = await Chamados.findByPk(id);
    if (!chamado) {
      return res.status(404).json({ message: "Chamado não encontrado" });
    }  else {
      console.log("CHAMADO ENCONTRADO: ", chamado);
    }

    chamado.status = status;
    await chamado.save();

    console.log("CHAMADO COM O NOVO STATUS: ", chamado);

    // = = = Envio de Mensagens = = =
    const empresa = await Empresas.findByPk(chamado.empresa_id);
    const nome = empresa.nome;
    const numeroChamado = chamado.id;
    const dataHora = chamado.data_agenda;
    const telefone = empresa.telefone
    let link = "a definir";
    let mensagem;

    if(status === "Agendamento") {
      chamado.status = "Agendamento";
      await chamado.save();
      mensagem = `Olá! ${nome} Tudo certo?\nSeu chamado de içamento ${numeroChamado} está sendo agendado no nosso Portal Exclusivo para as Assistências Customer Services Samsung. ✅\n\n📌 Acompanhe os próximos passos pelo portal: ${link}\nAlém disso, você também receberá as atualizações por aqui no WhatsApp.\n\nQualquer dúvida, é só nos chamar por aqui.\nObrigado!\nPortal de Içamento SAMSUNG`;
      await enviarNotificacaoWhatsapp(telefone, mensagem);
    } else if(status === "Agendado") {
      chamado.status = "Agendado";
      await chamado.save();
      mensagem = `Olá, ${nome}! Tudo certo?\nSeu chamado de içamento nº ${numeroChamado} foi aberto e já está agendado com sucesso para: ${dataHora}, no nosso Portal Exclusivo para as Assistências Customer Services Samsung. ✅\n\n📌 O agendamento foi aprovado pela empresa de içamento, e você poderá acompanhar os próximos passos pelo portal: ${link}\nAlém disso, você continuará recebendo as atualizações por aqui, no WhatsApp.\n\nQualquer dúvida, é só nos chamar por aqui.\nObrigado!\nPortal de Içamento SAMSUNG`;
      await enviarNotificacaoWhatsapp(telefone, mensagem);
    } else if(status === "Em Execução") {
      chamado.status = "Em Execução";
      await chamado.save();
      mensagem = `Olá, ${nome}! Tudo certo?
      Seu chamado de içamento nº ${numeroChamado} está em execução neste momento, conforme o agendamento realizado anteriormente. 🏗️⚙️
      
      📌 Você pode acompanhar o andamento diretamente no nosso Portal Exclusivo para as Assistências Customer Services Samsung: ${link}
      
      Qualquer dúvida, é só nos chamar por aqui.
      Obrigado!
      Portal de Içamento SAMSUNG
      `;
      await enviarNotificacaoWhatsapp(telefone, mensagem);
    } else if(status === "Finalizado") {
      chamado.status = "Finalizado";
      await chamado.save();
      mensagem = `Olá, ${nome}! Tudo certo?\nInformamos que o seu chamado de içamento nº ${numeroChamado} foi finalizado com sucesso. ✅\n\n📌 As evidências do serviço já estão disponíveis para consulta no nosso Portal Exclusivo para as Assistências Customer Services Samsung: ${link}\n\nQualquer dúvida, estamos à disposição por aqui.\nObrigado!\nPortal de Içamento SAMSUNG`;
      await enviarNotificacaoWhatsapp(telefone, mensagem);
    } else if(status === "No-show") {
      chamado.status = "No-show";
      await chamado.save();
      message = `Olá, ${nome}! Tudo certo?\nInformamos que, devido a ocorrências que impediram a realização do içamento, o agendamento foi considerado concluído. ⚠️\n\n⚠️ Importante: Conforme nossas políticas, o no-show implica na cobrança da taxa de no-show.\n\n📌 Para mais detalhes, acesse o nosso Portal Exclusivo para as Assistências Customer Services Samsung: ${link}\n\nQualquer dúvida, estamos à disposição por aqui.\nObrigado!\nPortal de Içamento SAMSUNG`;
      await enviarNotificacaoWhatsapp(telefone, mensagem);
    } else if(status === "Cancelado") {
      chamado.status = "Cancelado";
      await chamado.save();
      message = `Olá, ${nome}! Tudo certo?
      Informamos que o chamado de içamento nº ${numeroChamado} foi **cancelado**. ❌

      📌 Você pode verificar os detalhes no nosso Portal Exclusivo para as Assistências Customer Services Samsung: ${link}

      Se precisar de um novo agendamento ou tiver qualquer dúvida, é só nos chamar por aqui.
      Obrigado!
      Portal de Içamento SAMSUNG
      `;
      await enviarNotificacaoWhatsapp(telefone, mensagem);
    }

    res.json({ message: "Status atualizado", status });
  } catch (err) {
    console.error("Erro ao atualizar status:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.post('/empresa-icamentos/finalizar-chamado/:id', upload.array('fotos', 10), async (req, res) => {
  const chamadoId = req.params.id;
  const {
    horario_finalizacao,
    obs_finalizacao,
    cliente_presente,
    tecnico_presente,
    produto_ok
  } = req.body;

  const arquivos = req.files || [];

  try {
    const chamado = await Chamados.findByPk(chamadoId);
    if (!chamado) return res.status(404).send('Chamado não encontrado');

    let caminhosArquivos = '';
    if (arquivos.length > 0) {
      caminhosArquivos = arquivos.map(file => path.join('uploads/finalizacoes', file.filename)).join(',');
    }

    const clientePresente = cliente_presente?.trim().toLowerCase() === 'sim';
    const tecnicoPresente = tecnico_presente?.trim().toLowerCase() === 'sim';
    const produtoOk = produto_ok?.trim().toLowerCase();

    // Salva finalização
    await Chamados_Finalizados.create({
      chamado_id: chamadoId,
      horario_finalizacao,
      observacoes: obs_finalizacao,
      caminho: caminhosArquivos
    });

    const empresa = await Empresas.findByPk(chamado.empresa_id);
    const nome = empresa.nome;
    const numeroChamado = chamado.id;
    const telefone = empresa.telefone;
    const link = 'a definir';
    let mensagem = '';

    if (clientePresente && tecnicoPresente && produtoOk === 'sim') {
      chamado.status = 'Finalizado';
      mensagem = `Olá, ${nome}! Tudo certo?\nInformamos que o seu chamado de içamento nº ${numeroChamado} foi finalizado com sucesso. ✅\n\n📌 As evidências do serviço já estão disponíveis para consulta no nosso Portal Exclusivo para as Assistências Customer Services Samsung: ${link}\n\nQualquer dúvida, estamos à disposição por aqui.\nObrigado!\nPortal de Içamento SAMSUNG`;
    } else {
      chamado.status = 'No-show';
      mensagem = `Olá, ${nome}! Tudo certo?\nInformamos que, devido a ocorrências que impediram a realização do içamento o número ${numeroChamado}, o agendamento foi considerado concluído. ⚠️\n\n⚠️ Importante: Conforme nossas políticas, o no-show implica na cobrança da taxa de no-show.\n\n📌 Para mais detalhes, acesse o nosso Portal Exclusivo para as Assistências Customer Services Samsung: ${link}\n\nQualquer dúvida, estamos à disposição por aqui.\nObrigado!\nPortal de Içamento SAMSUNG`;
    }

    // Emitir NFS-e Asaas
    const hojeFormatado = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const dadosNfs = {
      payment: chamado.boletoId,
      customer: chamado.customer_id,
      externalReference: Math.floor(Math.random() * 999) + 1,
      value: chamado.amount,
      effectiveDate: hojeFormatado
    }

    const nfse = await agendarNfsAsaas(dadosNfs);
    const invoice = nfse.id;

    const nfseEmitida = await emitirNfs(invoice);
    const externalReference = nfseEmitida.externalReference;

    const notaAutorizada = await consultarNf(externalReference);
    console.log('Nota autorizada:', notaAutorizada);
    const nfseUrl = notaAutorizada.pdfUrl;

    chamado.nfseUrl = nfseUrl;

    let mensagemNfse = `Informamos que a sua nota fiscal foi emitida com sucesso. Para acessar, basta clicar no link abaixo:

${nfseUrl}`

    await chamado.save();
    await enviarNotificacaoWhatsapp(telefone, mensagem);
    await enviarNotificacaoWhatsapp(telefone, mensagemNfse);

    res.json({
      message: 'Finalização salva com sucesso',
      status: chamado.status
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao salvar finalização');
  }
});

app.put('/empresa-icamentos/chamado/:id/remarcar', async (req, res) => {
  try {
    const { id } = req.params;
    const { novaData } = req.body;

    const chamado = await Chamados.findByPk(id);
    if (!chamado) return res.status(404).json({ message: "Chamado não encontrado" });

    const agora = new Date();
    const dataAgendada = new Date(chamado.data_agenda);

    // Verifica se está a mais de 24 horas da data agendada
    const diffHoras = (dataAgendada - agora) / (1000 * 60 * 60);
    if (diffHoras <= 24) {
      return res.status(400).json({ message: "Só é possível remarcar com mais de 24h de antecedência" });
    }

    // Salva nova data proposta
    chamado.nova_data_proposta = novaData;
    await chamado.save();

    const empresa = await Empresas.findByPk(chamado.empresa_id);
    const nome = empresa.nome;
    const telefone = empresa.telefone;
    const numeroChamado = chamado.id;

    const mensagem = `Olá, ${nome}!
Estamos propondo uma nova data para o içamento do chamado nº ${numeroChamado}. 📅

🆕 Nova data sugerida: *${new Date(novaData).toLocaleString('pt-BR')}*

👉 Por favor, responda *SIM* para aceitar ou *NÃO* para recusar.

Após sua resposta, confirmaremos a alteração no nosso sistema.

Obrigado!
Portal de Içamento SAMSUNG`;

    await enviarNotificacaoWhatsapp(telefone, mensagem);

    res.json({ message: "Nova data proposta enviada ao cliente", novaData });
  } catch (err) {
    console.error("Erro ao remarcar:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

app.post('/cliente/chamado/:id/resposta-remarcacao', async (req, res) => {
  try {
    const { id } = req.params;
    const { resposta } = req.body; // "sim" ou "nao"

    const chamado = await Chamados.findByPk(id);
    if (!chamado) return res.status(404).json({ message: "Chamado não encontrado" });

    if (!chamado.nova_data_proposta) {
      return res.status(400).json({ message: "Não há nova data proposta" });
    }

    const empresa = await Empresas.findByPk(chamado.empresa_id);
    const nome = empresa.nome;
    const telefone = empresa.telefone;
    const numeroChamado = chamado.id;

    if (resposta.toLowerCase() === 'sim') {
      chamado.data_agenda = chamado.nova_data_proposta;
      chamado.nova_data_proposta = null;
      await chamado.save();

      const msg = `Olá, ${nome}! ✅
A nova data para o içamento do chamado nº ${numeroChamado} foi confirmada com sucesso.

📅 Nova data: *${new Date(chamado.data_agenda).toLocaleString('pt-BR')}*

Obrigado!
Portal de Içamento SAMSUNG`;
      await enviarNotificacaoWhatsapp(telefone, msg);
      return res.json({ message: "Data remarcada com sucesso" });
    } else {
      chamado.nova_data_proposta = null;
      await chamado.save();

      const msg = `Olá, ${nome}!
A nova data sugerida para o chamado nº ${numeroChamado} foi recusada.

Seguiremos com a data anterior: *${new Date(chamado.data_agenda).toLocaleString('pt-BR')}*

Obrigado!
Portal de Içamento SAMSUNG`;
      await enviarNotificacaoWhatsapp(telefone, msg);
      return res.json({ message: "Nova data recusada, mantendo original" });
    }
  } catch (err) {
    console.error("Erro na resposta de remarcação:", err);
    res.status(500).json({ message: "Erro interno" });
  }
});

module.exports = app;