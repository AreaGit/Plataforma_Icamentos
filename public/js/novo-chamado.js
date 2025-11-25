// ============================================================
//                 UTILITÁRIOS GERAIS
// ============================================================

// Pegar cookie
function getCookie(cname) {
  const name = cname + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');

  for (let cRaw of ca) {
    let c = cRaw;
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

const empresaId = getCookie("authEmpresaId");

// Alertas
function mostrarAvisoErro(msgExtra) {
  const box = document.getElementById("aviso-erro");
  if (!box) {
    if (msgExtra) alert(msgExtra);
    return;
  }

  const spanMsg = box.querySelector(".mensagem");
  if (spanMsg && msgExtra) spanMsg.textContent = msgExtra;

  box.style.display = "block";
}

function fecharAvisoErro() {
  const box = document.getElementById("aviso-erro");
  if (box) box.style.display = "none";
}

function mostrarAvisoSucesso(msgExtra) {
  const box = document.getElementById("aviso-sucesso");
  if (!box) {
    if (msgExtra) alert(msgExtra);
    return;
  }

  const spanMsg = box.querySelector(".mensagem");
  if (spanMsg && msgExtra) spanMsg.textContent = msgExtra;

  box.style.display = "block";
}

function fecharAvisoSucesso() {
  const box = document.getElementById("aviso-sucesso");
  if (box) box.style.display = "none";
}

// ============================================================
//                 VERIFICAÇÃO DE LOGIN
// ============================================================

// ===========================
// COOKIES VINDOS DO LOGIN
// ===========================
const authTipo = getCookie("authTipo");                           // admin / empresa / autorizado
const authAdminId = getCookie("authAdminId");                     // se admin
const authEmpresaId = getCookie("authEmpresaId");                 // se empresa OU se autorizado
const authUsuarioAutorizadoId = getCookie("authUsuarioAutorizadoId"); // se autorizado

// ===========================
// VERIFICAÇÃO DE LOGIN
// ===========================

// 1️⃣ Não tem tipo? Não está logado
if (!authTipo) {
  window.location.href = "/samsung/";
}

// 2️⃣ Validar cada tipo de usuário separadamente:
let autenticado = false;

if (authTipo === "admin" && authAdminId) autenticado = true;

if (authTipo === "empresa" && authEmpresaId) autenticado = true;

if (authTipo === "autorizado" && authUsuarioAutorizadoId && authEmpresaId)
  autenticado = true;

// 3️⃣ Se nada disso for válido → não logado
if (!autenticado) {
  window.location.href = "/samsung/";
}

// ============================================================
//                 CARREGAR DADOS DA ASSISTÊNCIA
// ============================================================

async function carregarInfoUsers(id) {
  try {
    const response = await fetch(`/assistencia/${id}`);
    if (!response.ok) throw new Error("Erro ao consultar assistência");

    const result = await response.json();
    return {
      id: result.id,
      nome: result.nome,
      email: result.email,
      telefone: result.telefone,
      cnpj: result.cnpj,
      customer_asaas_id: result.customer_asaas_id
    };
  } catch (error) {
    console.error("Erro carregarInfoUsers:", error);
    return null;
  }
}

// ============================================================
//                 LÓGICA PRINCIPAL
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-chamado');
  const loadingScreen = document.querySelector('.loading-screen');
  const btnSubmit = document.getElementById('btnSubmit');

  let valorChamado = null;
  let valorEmpresaIcamento = null;

  // Garantia: loading escondido ao carregar
  if (loadingScreen) loadingScreen.style.display = 'none';

  // ------------------------------------------------------------
  // ART – mostrar/esconder campos extras
  // ------------------------------------------------------------
  const artSelect = document.getElementById('art');
  const artInfo = document.getElementById('art-info');
  const artCpfInput = document.getElementById('art_cpf');

  if (artSelect && artInfo) {
    artSelect.addEventListener('change', () => {
      const val = (artSelect.value || '').toLowerCase();
      if (val === 'sim') {
        artInfo.style.display = 'block';
      } else {
        artInfo.style.display = 'none';
        const artNome = document.getElementById('art_nome');
        if (artNome) artNome.value = '';
        if (artCpfInput) artCpfInput.value = '';
      }
    });
  }

  // Máscara simples de CPF
  if (artCpfInput) {
    artCpfInput.addEventListener('input', (e) => {
      let v = e.target.value.replace(/\D/g, '');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d)/, '$1.$2');
      v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      e.target.value = v;
    });
  }

  // ------------------------------------------------------------
  // FLATPICKR – Data agendada (formato BR)
  // ------------------------------------------------------------
  const dataAgendadaInput = document.getElementById('data_agendada');
  if (dataAgendadaInput) {
    flatpickr("#data_agendada", {
      locale: "pt",
      dateFormat: "d/m/Y",  // formato brasileiro
      disable: [
        function (date) {
          // Bloqueia sábado (6) e domingo (0)
          return date.getDay() === 0 || date.getDay() === 6;
        }
      ],
      minDate: "today"
    });
  }

  // ------------------------------------------------------------
  // CEP – máscara e auto-preenchimento ViaCEP
  // ------------------------------------------------------------
  const cepInput = document.getElementById('cep');

  if (cepInput) {
    cepInput.addEventListener('input', () => {
      let value = cepInput.value.replace(/\D/g, '');
      if (value.length > 5) {
        value = value.slice(0, 5) + '-' + value.slice(5, 8);
      }
      cepInput.value = value;
    });

    cepInput.addEventListener('blur', async function () {
      const cep = this.value.replace(/\D/g, '');
      if (cep.length === 8) {
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          const data = await response.json();

          if (data.erro) {
            alert('CEP não encontrado.');
            return;
          }

          document.getElementById('estado').value = data.uf || '';
          document.getElementById('cidade').value = data.localidade || '';
          document.getElementById('bairro').value = data.bairro || '';
          document.getElementById('rua').value = data.logradouro || '';
        } catch (error) {
          alert('Erro ao buscar o endereço.');
        }
      }
    });
  }

  // ------------------------------------------------------------
  // CÁLCULO DO VALOR
  // ------------------------------------------------------------

  const camposParaCalculo = [
    'produto', 'tipo_icamento', 'estado', 'cidade',
    'art', 'vt', 'local', 'regiao'
  ];

  function camposPreenchidosParaCalculo() {
    return camposParaCalculo.every(id => {
      const el = document.getElementById(id);
      if (!el) return false;
      const val = (el.value || '').trim();
      return val !== '' && val !== 'Selecionar...';
    });
  }

  const btnCalcular = document.getElementById('btnCalcular');
  const valorDiv = document.getElementById('valor-icamento');

  function mapSimNao(val) {
    const v = (val || '').toLowerCase();
    if (v === 'sim') return 'Sim';
    if (v === 'não' || v === 'nao') return 'Não';
    return val;
  }

  async function calcularValor() {
    if (!camposPreenchidosParaCalculo()) {
      if (valorDiv) valorDiv.textContent = 'R$ 0,00';
      alert('Preencha todos os campos obrigatórios relacionados ao cálculo (produto, tipo, endereço e opções VT/ART).');
      return;
    }

    const vtFront = document.getElementById('vt').value;
    const artFront = document.getElementById('art').value;

    const payload = {
      produto: document.getElementById('produto').value,
      tipo_icamento: document.getElementById('tipo_icamento').value,
      uf: document.getElementById('estado').value,
      local: document.getElementById('local').value,
      regiao: document.getElementById('regiao').value,
      art: mapSimNao(artFront),
      vt: mapSimNao(vtFront)
    };

    try {
      const res = await fetch('/calcular-valor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        if (valorDiv) valorDiv.textContent = 'Erro: ' + (data.erro || 'Erro desconhecido');
        return;
      }

      valorEmpresaIcamento = data.valor2;
      valorChamado = parseFloat(data.valor);

      if (valorDiv) {
        valorDiv.textContent = `R$ ${data.valor}`;
      }

      // habilita submit
      if (btnSubmit) btnSubmit.disabled = false;
      if (btnCalcular) btnCalcular.style.display = 'none';
    } catch (err) {
      console.error(err);
      if (valorDiv) valorDiv.textContent = 'Erro ao conectar com o servidor.';
    }
  }

  if (btnCalcular) {
    btnCalcular.addEventListener('click', calcularValor);
  }

  // Se algum campo usado no cálculo mudar, exige novo cálculo
  camposParaCalculo.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        // resetar valores
        valorChamado = null;
        valorEmpresaIcamento = null;

        if (btnCalcular) btnCalcular.style.display = 'inline-flex';
        if (valorDiv) valorDiv.textContent = 'R$ 0,00';
        if (btnSubmit) btnSubmit.disabled = true;
      });
    }
  });

  // ------------------------------------------------------------
  // SUBMISSÃO DO FORMULÁRIO
  // ------------------------------------------------------------
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!valorChamado) {
        alert('Por favor, calcule o valor do içamento antes de criar o chamado.');
        return;
      }

      if (loadingScreen) loadingScreen.style.display = 'flex';

      try {
        // Data agendada em d/m/Y
        const dataAgendadaStr = dataAgendadaInput ? dataAgendadaInput.value : '';
        const [dia, mes, ano] = (dataAgendadaStr || '').split('/');

        const dataAgendada = new Date(`${ano}-${mes}-${dia}T00:00:00`);
        const agora = new Date();

        if (isNaN(dataAgendada.getTime())) {
          if (loadingScreen) loadingScreen.style.display = 'none';
          alert('Data agendada inválida. Use o calendário para selecionar uma data.');
          return;
        }

        const diffHoras = (dataAgendada - agora) / (1000 * 60 * 60);
        if (diffHoras < 48) {
          if (loadingScreen) loadingScreen.style.display = 'none';
          alert('A data agendada deve ter no mínimo 48 horas a partir de agora.');
          return;
        }

        // Monta endereço
        const rua = document.getElementById('rua').value;
        const numero = document.getElementById('numero').value;
        const bairro = document.getElementById('bairro').value;
        const cidade = document.getElementById('cidade').value;
        const estado = document.getElementById('estado').value;
        const cep = document.getElementById('cep').value;

        const endereco = `${rua}, ${numero} - ${bairro}, ${cidade} - ${estado}, ${cep}`;
        const idEmpresa = getCookie("authEmpresaId");
        // Dados da assistência (proprietário)
        const dadosUser = await carregarInfoUsers(parseInt(idEmpresa));
        if (!dadosUser) {
          if (loadingScreen) loadingScreen.style.display = 'none';
          mostrarAvisoErro('Erro ao carregar dados da empresa. Tente novamente.');
          return;
        }

        // Mapeia VT e ART
        const vtFront = document.getElementById('vt').value;
        const artFront = document.getElementById('art').value;

        const vtFinal = mapSimNao(vtFront);
        const artFinal = mapSimNao(artFront);

        const formData = new FormData();

        formData.append('empresa_id', idEmpresa);
        formData.append('customer_asaas_id', dadosUser.customer_asaas_id || '');
        formData.append('nome', dadosUser.nome || '');
        formData.append('telefone', dadosUser.telefone || '');
        formData.append('email', dadosUser.email || '');
        formData.append('cnpj', dadosUser.cnpj || '');

        formData.append('ordem', document.getElementById('ordem').value);
        formData.append('descricao', document.getElementById('descricao').value);

        formData.append('endereco', endereco);
        formData.append('rua', rua);
        formData.append('cidade', cidade);
        formData.append('estado', estado);
        formData.append('cep', cep);

        formData.append('tipo_icamento', document.getElementById('tipo_icamento').value);
        formData.append('produto', document.getElementById('produto').value);
        formData.append('vt', vtFinal);
        formData.append('art', artFinal);

        if (artFinal === 'Sim') {
          formData.append('art_nome', document.getElementById('art_nome').value || '');
          formData.append('art_cpf', document.getElementById('art_cpf').value || '');
        } else {
          formData.append('art_nome', '');
          formData.append('art_cpf', '');
        }

        formData.append('data_agendada', dataAgendadaStr);
        formData.append('horario_agenda', document.getElementById('horario').value);
        formData.append('informacoes_uteis', document.getElementById('informacoes_uteis').value || '');
        formData.append('amount', valorChamado);
        formData.append('amount_company', valorEmpresaIcamento);

        // Anexos
        const arquivos = document.getElementById('anexos').files;
        for (let i = 0; i < arquivos.length; i++) {
          formData.append('anexos', arquivos[i]);
        }

        const res = await fetch('/criar-chamado', {
          method: 'POST',
          body: formData
        });

        const result = await res.json();

        if (loadingScreen) loadingScreen.style.display = 'none';

        if (result.success) {
          mostrarAvisoSucesso('Chamado criado com sucesso! Aguarde a aprovação.');
          setTimeout(() => {
            window.location.href = '/samsung/dashboard';
          }, 3000);
        } else {
          mostrarAvisoErro('Erro ao criar chamado: ' + (result.message || 'Erro desconhecido.'));
        }

      } catch (err) {
        console.error(err);
        if (loadingScreen) loadingScreen.style.display = 'none';
        mostrarAvisoErro('Falha ao criar o chamado. Tente novamente.');
      }
    });
  }

  // ------------------------------------------------------------
  // BOTÃO VOLTAR / "LOGOUT"
  // ------------------------------------------------------------
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.href = '/samsung/dashboard';
    });
  }
});