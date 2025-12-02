const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const XLSX = require("xlsx");
const Empresas = require('../models/Empresas');
const Usuarios_Autorizados = require('../models/Usuarios_Autorizados');
const Administradores = require('../models/Administradores');
const { criarClienteAsaas } = require('./api/asaas');
const { client, sendMessage } = require('./api/whatsapp-web');
client.on('ready', () => {
  console.log('Cliente WhatsApp pronto para uso no cadastros.js');
});
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { Op } = require('sequelize');
const Empresas_Icamento = require('../models/Empresas_Icamento');
const request = require('request-promise');
const axios = require('axios');
const cookieParser = require('cookie-parser');
app.use(cookieParser());

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

async function enviarEmailNotificacao(destinatario, assunto, corpo) {
  const transporter = nodemailer.createTransport({
    host: 'email-ssl.com.br',  // Servidor SMTP da LocalWeb
    port: 465,                 // Porta para SSL (465)
    secure: true,              // Usar conexão segura (SSL)
    auth: {
      user: 'no-reply@portalicamento.com.br',  // E-mail que você vai usar para enviar
      pass: 'Z1mb@bue1',                    // Senha do e-mail
    },
  })

  const info = await transporter.sendMail({
    from: 'no-reply@portalicamento.com.br',
    to: destinatario,
    subject: assunto,
    html: corpo,
  });

  console.log('E-mail enviado:', info);
}

// Função utilitária para ler planilha
async function importarEmpresasDePlanilha(caminhoArquivo) {
  try {
    const workbook = XLSX.readFile(caminhoArquivo);
    const sheetName = workbook.SheetNames[0];
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    console.log(`📊 Lendo planilha: ${sheetName} (${data.length} registros)`);

    for (const [index, linha] of data.entries()) {
      console.log(`➡️ [${index + 1}/${data.length}] Iniciando cadastro: ${linha.nome} (${linha.cnpj})`);

      try {
        // --- Sanitização básica ---
        const cnpjFormatado = linha.cnpj.replace(/[^\d]+/g, '');
        const telefoneFormatado = linha.telefone.replace(/\D/g, '');

        // --- Criação do cliente ASAAS ---
        const dadosCliente = {
          name: linha.razao_social,
          document: cnpjFormatado,
          email: linha.email,
          phone: telefoneFormatado,
          address: linha.rua,
          addressNumber: linha.numeroResidencia?.toString() || '',
          complement: linha.complemento || '',
          province: linha.bairro,
          postalCode: linha.cep,
          externalReference: Math.floor(Math.random() * 999) + 1
        };

        const clienteAsaas = await criarClienteAsaas(dadosCliente);

        // --- Criação no banco local ---
        const senhaHash = await bcrypt.hash(linha.senha.toString(), 10);

        const novaEmpresa = await Empresas.create({
          nome: linha.nome,
          customer_asaas_id: clienteAsaas.id,
          cep: linha.cep,
          estado: linha.estado,
          cidade: linha.cidade,
          bairro: linha.bairro,
          rua: linha.rua,
          numeroResidencia: parseInt(linha.numeroRes),
          complemento: linha.complemento,
          razao_social: linha.razao,
          cnpj: cnpjFormatado,
          telefone: telefoneFormatado,
          email: linha.email,
          senha: senhaHash
        });

        console.log(`✅ Empresa cadastrada: ${novaEmpresa.nome} (ID ASAAS: ${clienteAsaas.id})`);
      } catch (err) {
        console.error(`❌ Erro ao cadastrar ${linha.nome || 'empresa desconhecida'}:`, err.message);
      }
    }

    console.log('🎯 Importação concluída!');
  } catch (err) {
    console.error('❌ Erro ao ler planilha:', err.message);
  }
}

//importarEmpresasDePlanilha("./routes/tab.xlsx")

// Cadastro de empresa
app.post('/cadastrar', async (req, res) => {
  try {
    const {
      nome, cep, estado, cidade, bairro, rua, numeroRes,
      complemento, razao, cnpj, telefone, email, senha
    } = req.body;

    function formatarCNPJ(cnpj) {
      cnpj = cnpj.replace(/[^\d]+/g, ''); // remove tudo que não é número

      if (cnpj.length !== 14) return cnpj;

      return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    const cnpjFormatado = formatarCNPJ(cnpj);

    function formatarTelefone(telefone) {
      return telefone.replace(/\D/g, '');
    }

    const telefoneFormatado = formatarTelefone(telefone);

    const dadosCliente = {
      name: razao,
      document: cnpjFormatado,
      email: email,
      phone: telefone,
      address: rua,
      addressNumber: numeroRes,
      complement: complemento,
      province: bairro,
      postalCode: cep,
      externalReference: Math.floor(Math.random() * 999) + 1
    };

    const clienteAsaas = await criarClienteAsaas(dadosCliente);
    const senhaHash = await bcrypt.hash(senha, 10);
    const novaEmpresa = await Empresas.create({
      nome,
      customer_asaas_id: clienteAsaas.id,
      cep,
      estado,
      cidade,
      bairro,
      rua,
      numeroResidencia: parseInt(numeroRes),
      complemento,
      razao_social: razao,
      cnpj,
      telefone,
      email,
      senha: senhaHash
    });
      
    return res.status(201).json({ success: true, empresa: novaEmpresa });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Erro ao cadastrar empresa.' });
  }
});

// Cadastro de usuários autorizados pela empresa
app.post('/cadastrar-usuarios', async (req, res) => {
  try {
    const {
      empresa_id, empresa, nome, telefone, email, senha
    } = req.body;

    console.log("EMPRESA: ", empresa)

    const senhaHash = await bcrypt.hash(senha, 10);
    
    const empresaEncontrada = await Empresas.findOne({
      where: { nome: empresa },
    });

    console.log(empresaEncontrada)

    const novoUsuario = await Usuarios_Autorizados.create({
      empresa_id: empresaEncontrada.id,
      nome,
      email,
      telefone,
      senha: senhaHash
    });

    return res.status(201).json({ success: true, usuario: novoUsuario });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Erro ao cadastrar usuario.' });
  }
});

// ===================================================
// LOGIN (EMPRESAS + USUÁRIOS AUTORIZADOS)
// ===================================================
app.post("/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ message: "Email e senha obrigatórios." });
    }

    // ===================================================
    // 1. TENTA LOGAR COMO ADMINISTRADOR
    // ===================================================
    const admin = await Administradores.findOne({ where: { email } });

    if (admin) {
      const senhaOk = await bcrypt.compare(senha, admin.senha);
      if (!senhaOk) return res.status(401).json({ message: "Senha incorreta" });

      res.cookie("authTipo", "admin");
      res.cookie("authAdminId", admin.id);
      res.cookie("authNome", admin.nome);

      return res.json({
        success: true,
        tipo: "admin",
        nome: admin.nome,
        message: "Login administrador OK"
      });
    }

    // ===================================================
    // 2. EMPRESA PROPRIETÁRIA
    // ===================================================
    let empresa = await Empresas.findOne({ where: { email } });
    if (empresa) {
      const senhaOk = await bcrypt.compare(senha, empresa.senha);
      if (!senhaOk) return res.status(401).json({ message: "Senha incorreta" });

      res.cookie("authTipo", "empresa");
      res.cookie("authEmpresaId", empresa.id);
      res.cookie("authNome", empresa.nome);

      return res.json({
        success: true,
        tipo: "empresa",
        nome: empresa.nome
      });
    }

    // ===================================================
    // 3. USUÁRIO AUTORIZADO
    // ===================================================
    const user = await Usuarios_Autorizados.findOne({ where: { email } });

    if (user) {
      const senhaOk = await bcrypt.compare(senha, user.senha);
      if (!senhaOk) return res.status(401).json({ message: "Senha incorreta" });

      res.cookie("authTipo", "autorizado");
      res.cookie("authUsuarioAutorizadoId", user.id);
      res.cookie("authEmpresaId", user.empresa_id);
      res.cookie("authNome", user.nome);

      return res.json({
        success: true,
        tipo: "autorizado",
        nome: user.nome
      });
    }

    return res.status(404).json({ message: "Usuário não encontrado" });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erro interno" });
  }
});

app.post("/esqueci-senha", async (req, res) => {
  try {
    const { email } = req.body;

    const gerarToken = () => crypto.randomBytes(20).toString('hex');
    const token = gerarToken();
    const expiracao = new Date(Date.now() + 3600000); // 1h

    // Procurar na tabela empresas
    let user = await Empresas.findOne({ where: { email } });

    let tipo = "empresa";
    if (!user) {
      // Procurar em usuários autorizados
      user = await Usuarios_Autorizados.findOne({ where: { email } });
      tipo = "usuario";
    }

    if(!user) {
      user = await Administradores.findOne({ where: { email } });
      tipo = "admin"
    }

    if (!user) {
      return res.status(404).json({ message: "E-mail não encontrado" });
    }

    await user.update({
      reset_token: token,
      reset_token_expiration: expiracao,
    });

    const resetLink = `portalicamento.com.br/samsung/redefinir-senha?token=${token}&tipo=${tipo}`;

    const mensagemStatus = `
      <p>Olá,</p>
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p>Clique no link abaixo para definir uma nova senha:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      <p>Este link é válido por 1 hora.</p>
    `;
    console.log(resetLink, token);
    // Enviar notificação de código por e-mail
    await enviarEmailNotificacao(email, `Código de Verificação do usuário `, mensagemStatus);

    res.json({ message: "E-mail de recuperação enviado" });

  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    res.status(500).json({ message: "Erro ao enviar e-mail de recuperação" });
  }
});

app.post("/resetar-senha", async (req, res) => {
  try {
    const { token, senha, tipo, tipoUser } = req.body;
    let tabela;

    if(tipoUser == "empresa") {
      tabela = Empresas;
    } else if(tipoUser == "usuario") {
      tabela = Usuarios_Autorizados;
    } else if(tipoUser == "admin") {
      tabela = Administradores;
    };

    // const tabela = tipo === "empresa" ? Empresas : Usuarios_Autorizados;

    console.log(tabela)

    const user = await tabela.findOne({
      where: {
        reset_token: token,
        reset_token_expiration: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Token inválido ou expirado" });
    }

    const hash = await bcrypt.hash(senha, 10);
    await user.update({
      senha: hash,
      reset_token: null,
      reset_token_expiration: null,
    });

    res.json({ message: "Senha redefinida com sucesso" });

  } catch (error) {
    console.error("Erro ao redefinir senha:", error);
    res.status(500).json({ message: "Erro ao redefinir senha" });
  }
});


// Função para formatar o número de telefone
function formatPhone(telefone) {
  const ddd = telefone.replace(/\D/g, '').slice(0, 2);
  const number = telefone.replace(/\D/g, '').slice(2);
  return { ddd, number };
}

/*app.post('/cadastrar-empresas-icamento', async (req, res) => {
  try {
    const {
      nome, cep, estado, cidade, bairro, rua, numeroRes, complemento,
      telefone, cnpj, razao, email, conta_corrente, agencia, banco, senha
    } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);

    // Formatação e Validação do Telefone
    const telefoneMatch = telefone.match(/\((\d{2})\)\s*(\d{4,5})-?(\d{4})/);
    if (!telefoneMatch) {
      return res.status(400).json({ message: "Número de telefone inválido. O formato deve ser (DD) NNNNN-NNNN" });
    }
    const ddd = telefoneMatch[1];
    const telefoneformatado = `${telefoneMatch[2]}${telefoneMatch[3]}`; // Remove traço do número

    // Formata CNPJ e número da conta
    const cnpjFormatado = cnpj.replace(/[^\d]+/g, '');
    const contaCorrenteSemHifen = conta_corrente.replace(/-/g, '');

    // Validação do CNPJ com 14 dígitos
    if (cnpjFormatado.length !== 14) {
      return res.status(400).json({ message: "CNPJ inválido. Deve conter 14 dígitos." });
    }

    // Função para calcular o dígito verificador da agência (se necessário)
    function calcularDigitoAgencia(agencia) {
      const pesos = [5, 4, 3, 2];
      let soma = 0;
      for (let i = 0; i < agencia.length; i++) {
          soma += parseInt(agencia[i]) * pesos[i];
      }
      const mod11 = soma % 11;
      let digito = 11 - mod11;
      if (digito === 10 || digito === 11) digito = 0;
      return digito.toString();
    }
    const digitoVerificador = calcularDigitoAgencia(agencia);

    const options = {
      method: 'POST',
      url: 'https://api.pagar.me/core/v5/recipients',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: 'Basic ' + Buffer.from(`sk_KVlgJBsKOTQagkmR:`).toString('base64')
      },
      body: {
        register_information: {
          main_address: {
            street: rua,
            complementary: complemento,
            street_number: numeroRes,
            neighborhood: bairro,
            city: cidade,
            state: estado,
            zip_code: cep,
            reference_point: 'Nenhum'
          },
          company_name: nome,
          trading_name: nome,
          email: email,
          document: cnpjFormatado,
          type: 'corporation',
          site_url: 'https://imprimeai.com.br',
          annual_revenue: 1000000,
          corporation_type: 'LTDA',
          founding_date: new Date().toISOString().split('T')[0],
          phone_numbers: [{ ddd, number: telefone, type: 'mobile' }],
          managing_partners: [{
            name: nome,
            email: email,
            document: cnpjFormatado,
            type: 'corporation',
            monthly_income: 120000,
            mother_name: 'Nulo',
            birthdate: new Date().toISOString().split('T')[0],
            professional_occupation: 'Empresa Içamento',
            self_declared_legal_representative: true,
            address: {
              street: rua,
              complementary: complemento,
              street_number: numeroRes,
              neighborhood: bairro,
              city: cidade,
              state: estado,
              zip_code: cep,
              reference_point: 'Nenhum'
            },
            phone_numbers: [{ ddd, number: telefoneformatado, type: 'mobile' }]
          }]
        },
        default_bank_account: {
          holder_name: nome,
          holder_document: cnpjFormatado,
          holder_type: 'company',
          bank: banco,
          branch_number: agencia,
          branch_check_digit: digitoVerificador,
          account_number: contaCorrenteSemHifen,
          account_check_digit: 6,
          type: 'checking'
        },
        transfer_settings: {
          transfer_enabled: false,
          transfer_interval: 'Daily',
          transfer_day: 0
        },
        automatic_anticipation_settings: {
          enabled: true,
          type: 'full',
          volume_percentage: 50,
          delay: null
        },
        code: Math.floor(1000 + Math.random() * 9000).toString()
      },
      json: true
    };

    const pagarmeResponse = await request(options);

    const novaEmpresa = await Empresas_Icamento.create({
      nome,
      cep,
      estado,
      cidade,
      bairro,
      rua,
      numeroRes,
      complemento,
      telefone,
      cnpj,
      razao,
      email,
      conta_corrente,
      agencia,
      banco,
      senhaHash,
      recipientId: pagarmeResponse.id
    });

    return res.status(201).json({ empresa: novaEmpresa });
  } catch (error) {
    console.error('Erro ao cadastrar empresa:', error);
    return res.status(500).json({ error: 'Erro ao cadastrar empresa' });
  }
});*/

app.post('/cadastrar-empresas-icamento', async (req, res) => {
  try {
    const {
      nome, cep, estado, cidade, bairro, rua, numeroRes, complemento,
      telefone, cnpj, razao, email, conta_corrente, agencia, banco, ispbBanco, senha
    } = req.body;

    const senhaHash = await bcrypt.hash(senha, 10);

    const telefoneMatch = telefone.match(/\((\d{2})\)\s*(\d{4,5})-?(\d{4})/);
    if (!telefoneMatch) {
      return res.status(400).json({ message: "Número de telefone inválido. Use o formato (DD) 99999-9999" });
    }
    const ddd = telefoneMatch[1];
    const telefoneFormatado = `${telefoneMatch[2]}${telefoneMatch[3]}`; // Ex: 959099039

    const cnpjFormatado = cnpj.replace(/[^\d]/g, '');
    const contaCorrenteSemHifen = conta_corrente.replace(/-/g, '');
    const account_number = contaCorrenteSemHifen.slice(0, -1);
    const account_check_digit = contaCorrenteSemHifen.slice(-1);

    if (cnpjFormatado.length !== 14) {
      return res.status(400).json({ message: "CNPJ inválido. Deve conter 14 dígitos." });
    }

    function calcularDigitoAgencia(agencia) {
      const pesos = [5, 4, 3, 2];
      let soma = 0;
      for (let i = 0; i < agencia.length; i++) {
        soma += parseInt(agencia[i]) * pesos[i];
      }
      const mod11 = soma % 11;
      let digito = 11 - mod11;
      if (digito === 10 || digito === 11) digito = 0;
      return digito.toString();
    }
    const digitoVerificador = calcularDigitoAgencia(agencia);

    const dadosCliente = {
      name: nome,
      document: cnpjFormatado,
      email: email,
      phone: telefoneFormatado,
      address: rua,
      addressNumber: numeroRes,
      complement: complemento,
      province: bairro,
      postalCode: cep,
      externalReference: Math.floor(Math.random() * 999) + 1
    };

    const cliente = await criarClienteAsaas(dadosCliente);
    console.log("Cliente criado: ", cliente);

    const novaEmpresa = await Empresas_Icamento.create({
      nome: nome,
      customer_asaas_id: cliente.id,
      cep: cep,
      estado: estado,
      cidade: cidade,
      bairro: bairro,
      rua: rua,
      numeroResidencia: numeroRes,
      complemento: complemento,
      telefone: telefone,
      cnpj: cnpj,
      razao_social: razao,
      email: email,
      conta_corrente: conta_corrente,
      agencia: agencia,
      banco: banco,
      ispbBanco: ispbBanco,
      senha: senhaHash,
      status: "Ativa"
    });

    return res.status(201).json({ success: true, empresa: novaEmpresa });
  } catch (error) {
    console.error('Erro ao cadastrar empresa:', error?.response?.body || error);
    return res.status(500).json({ error: 'Erro ao cadastrar empresa' });
  }
});

app.post('/login-empresas-icamento', async (req, res) => {
  try {
    const { email, senha } = req.body;
    // Verfica se existe no banco de dados
    const empresa = await Empresas_Icamento.findOne({ where: { email: email} });

    if(!empresa) {
      return res.status(401).json({ message: "Empresa não encontrada!" });
    }

    const passwordMatch = bcrypt.compare(senha, empresa.senha);

    // Verfica se a senha está correta
    if(!passwordMatch) {
      return res.status(401).json({ message: "Senha incorreta!" });
    }

    res.cookie("id_empresa", empresa.id);
    res.cookie("nomeEmpresa", empresa.nome);
    res.cookie("tipo", "icamento");
    
    res.json({ message: "Login feito com Sucesso!" });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({ message: "Erro ao Fazer o Login <br> Preencha os Campos Corretamente" });
  }
});

app.get('/logout', (req, res) => {
    // Apaga todos os cookies
    for (let cookieName in req.cookies) {
        res.clearCookie(cookieName);
    }

    // Redireciona para a página inicial ou de login
    res.redirect('/samsung/');
});

module.exports = app;