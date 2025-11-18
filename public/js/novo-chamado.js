function getCookie(cname) {
    let name = cname + "="
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while(c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if(c.indexOf(name) == 0) {
            return c.substring(name.length, c.length)
        }
    }
    return "";
}

let id_empresa = getCookie("idEmpresa");
let id_usuario = getCookie("idUsuario");

if (!id_empresa && !id_usuario) {
    window.location.href = `/samsung/`;
}

let valor_empresa_icamento;
let valorChamado;

// ========================
// UTILITÁRIOS DE ALERTA
// ========================
window.addEventListener('load', function () {
  // Quando a página carrega
  const loading = document.querySelector('.loading-screen');
  if (loading) loading.style.display = 'none';
});

function mostrarAvisoErro(msgExtra) {
  const box = document.getElementById("aviso-erro");
  if (box) {
    box.style.display = "block";
    if (msgExtra) {
      const spanMsg = box.querySelector('.mensagem');
      if (spanMsg) spanMsg.textContent = msgExtra;
    }
  } else if (msgExtra) {
    alert(msgExtra);
  }
}

function fecharAvisoErro() {
  const box = document.getElementById("aviso-erro");
  if (box) box.style.display = "none";
}

function mostrarAvisoSucesso(msgExtra) {
  const box = document.getElementById("aviso-sucesso");
  if (box) {
    box.style.display = "block";
    if (msgExtra) {
      const spanMsg = box.querySelector('.mensagem');
      if (spanMsg) spanMsg.textContent = msgExtra;
    }
  } else if (msgExtra) {
    alert(msgExtra);
  }
}

function fecharAvisoSucesso() {
  const box = document.getElementById("aviso-sucesso");
  if (box) box.style.display = "none";
}

// ========================
// COOKIES
// ========================
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

let idEmpresa = getCookie("idEmpresa");
let idUsuario = getCookie("idUsuario");

const form = document.getElementById('form-chamado');

// ========================
// ART – mostrar/esconder campos
// ========================
const artSelect = document.getElementById('art');
const artInfo = document.getElementById('art-info');
const artCpfInput = document.getElementById('art_cpf');

if (artSelect && artInfo) {
  artSelect.addEventListener('change', () => {
    // Trabalhamos com o valor em minúsculo para ser flexível
    const val = artSelect.value.toLowerCase();
    if (val === 'sim') {
      artInfo.style.display = 'block';
    } else {
      artInfo.style.display = 'none';
      const artNome = document.getElementById('art_nome');
      const artCpf = document.getElementById('art_cpf');
      if (artNome) artNome.value = '';
      if (artCpf) artCpf.value = '';
    }
  });
}

// Máscara simples de CPF (se o input existir)
if (artCpfInput) {
  artCpfInput.addEventListener('input', (e) => {
    let v = e.target.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
  });
}

// ========================
// FLATPICKR – Data agendada (formato BR)
// ========================
flatpickr("#data_agendada", {
  locale: "pt", // idioma português
  dateFormat: "d/m/Y", // formato brasileiro
  disable: [
    function (date) {
      // Bloqueia sábado (6) e domingo (0)
      return date.getDay() === 0 || date.getDay() === 6;
    }
  ],
  minDate: "today"
});

// ========================
// CEP – máscara e auto-preenchimento
// ========================
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

// ========================
// CÁLCULO DO VALOR
// ========================
const camposParaCalculo = [
  'produto', 'tipo_icamento', 'estado', 'cidade', 'art', 'vt', 'local', 'regiao'
];

function camposPreenchidos() {
  return camposParaCalculo.every(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '' && el.value !== 'Selecionar';
  });
}

async function calcularValor() {
  const valorDiv = document.getElementById('valor-icamento');
  const btnCalc = document.getElementById('btnCalcular');

  if (!camposPreenchidos()) {
    if (valorDiv) valorDiv.textContent = 'R$ 0,00';
    alert('Preencha todos os campos obrigatórios para calcular o valor.');
    return;
  }

  // Mapeia VT e ART para o formato do backend: 'Sim' / 'Não'
  const vtFront = document.getElementById('vt').value;
  const artFront = document.getElementById('art').value;

  const mapSimNao = (val) => {
    const v = (val || '').toLowerCase();
    if (v === 'sim') return 'Sim';
    if (v === 'não' || v === 'nao') return 'Não';
    return val; // fallback
  };

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

    valor_empresa_icamento = data.valor2;
    valorChamado = parseFloat(data.valor);

    if (valorDiv) {
      valorDiv.style.display = 'block';
      valorDiv.textContent = `R$ ${data.valor}`;
    }
    if (btnCalc) btnCalc.style.display = 'none';
  } catch (err) {
    console.error(err);
    if (valorDiv) valorDiv.textContent = 'Erro ao conectar com o servidor.';
  }
}

const btnCalcular = document.getElementById('btnCalcular');
if (btnCalcular) btnCalcular.addEventListener('click', calcularValor);

// Detecta alteração nos campos e mostra o botão novamente
camposParaCalculo.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      const btn = document.getElementById('btnCalcular');
      const valorDiv = document.getElementById('valor-icamento');
      if (btn) btn.style.display = 'block';
      if (valorDiv) {
        valorDiv.style.display = 'none';
        valorDiv.textContent = 'R$ 0,00';
      }
      valorChamado = undefined;
    });
  }
});

// ========================
// CARREGAR INFO DO USUÁRIO
// ========================
async function carregarInfoUsers(id) {
  try {
    const response = await fetch(`/assistencia/${id}`);
    const result = await response.json();

    const data = {
      id: result.id,
      nome: result.nome,
      email: result.email,
      telefone: result.telefone,
      cnpj: result.cnpj,
      customer_asaas_id: result.customer_asaas_id
    };

    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ========================
// SUBMISSÃO DO FORMULÁRIO
// ========================
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const loading = document.querySelector('.loading-screen');
    if (loading) loading.style.display = 'block';

    try {
      // Garante que o valor foi calculado
      if (typeof valorChamado === 'undefined') {
        if (loading) loading.style.display = 'none';
        alert('Por favor, calcule o valor do içamento antes de criar o chamado.');
        return;
      }

      // Data agendada – converter d/m/Y → objeto Date para validar 48h
      const dataAgendadaStr = document.getElementById('data_agendada').value; // ex: 31/12/2025
      const [dia, mes, ano] = dataAgendadaStr.split('/');
      const dataAgendada = new Date(`${ano}-${mes}-${dia}T00:00:00`);
      const agora = new Date();
      const diffHoras = (dataAgendada - agora) / (1000 * 60 * 60);

      if (isNaN(dataAgendada.getTime())) {
        if (loading) loading.style.display = 'none';
        alert('Data agendada inválida. Use o calendário para selecionar uma data.');
        return;
      }

      if (diffHoras < 48) {
        if (loading) loading.style.display = 'none';
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

      // Dados da assistência
      const dadosUser = await carregarInfoUsers(idEmpresa);
      if (!dadosUser) {
        if (loading) loading.style.display = 'none';
        mostrarAvisoErro('Erro ao carregar dados da empresa. Tente novamente.');
        return;
      }

      // Mapeia VT e ART para formato do backend
      const vtFront = document.getElementById('vt').value;
      const artFront = document.getElementById('art').value;
      const mapSimNao = (val) => {
        const v = (val || '').toLowerCase();
        if (v === 'sim') return 'Sim';
        if (v === 'não' || v === 'nao') return 'Não';
        return val;
      };

      const vtFinal = mapSimNao(vtFront);
      const artFinal = mapSimNao(artFront);

      const formData = new FormData();

      formData.append('empresa_id', getCookie("idEmpresa"));
      formData.append('customer_asaas_id', dadosUser.customer_asaas_id);
      formData.append('nome', dadosUser.nome);
      formData.append('telefone', dadosUser.telefone);
      formData.append('email', dadosUser.email);
      formData.append('cnpj', dadosUser.cnpj);
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

      // Só envia nome/CPF da ART se for "Sim"
      if (artFinal === 'Sim') {
        formData.append('art_nome', document.getElementById('art_nome').value || '');
        formData.append('art_cpf', document.getElementById('art_cpf').value || '');
      } else {
        formData.append('art_nome', '');
        formData.append('art_cpf', '');
      }

      // Aqui mantemos o valor em d/m/Y para o backend, pois ele parseia assim com moment
      formData.append('data_agendada', dataAgendadaStr);
      formData.append('horario_agenda', document.getElementById('horario').value);
      formData.append('informacoes_uteis', document.getElementById('informacoes_uteis').value);
      formData.append('amount', valorChamado);
      formData.append('amount_company', valor_empresa_icamento);

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

      if (loading) loading.style.display = 'none';

      if (result.success) {
        mostrarAvisoSucesso('Chamado criado com sucesso!');
        setTimeout(() => {
          window.location.href = '/samsung/dashboard';
        }, 3000);
      } else {
        mostrarAvisoErro('Erro ao criar chamado: ' + (result.message || 'Erro desconhecido.'));
      }

    } catch (err) {
      console.error(err);
      const loading = document.querySelector('.loading-screen');
      if (loading) loading.style.display = 'none';
      mostrarAvisoErro('Falha ao criar o chamado. Tente novamente.');
    }
  });
}

// ========================
// BOTÃO VOLTAR / LOGOUT
// ========================
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // se quiser realmente deslogar, aqui daria para limpar cookies
    // document.cookie = "idEmpresa=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    // document.cookie = "idUsuario=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = '/samsung/dashboard';
  });
}