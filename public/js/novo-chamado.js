let valor_empresa_icamento;

window.addEventListener('load', function() {
  // Quando a página carrega
  document.querySelector('.loading-screen').style.display = 'none'; // Oculta a tela de carregamento
});
function mostrarAvisoErro() {
  document.getElementById("aviso-erro").style.display = "block";
}

function fecharAvisoErro() {
  document.getElementById("aviso-erro").style.display = "none";
}

function mostrarAvisoSucesso() {
  document.getElementById("aviso-sucesso").style.display = "block";
}

function fecharAvisoSucesso() {
  document.getElementById("aviso-sucesso").style.display = "none";
}

const form = document.getElementById('form-chamado');
let enderecoCompleto

// Mostrar/esconder campos de ART conforme escolha
const artSelect = document.getElementById('art');
const artInfo = document.getElementById('art-info');
const artCpf = document.getElementById('art_cpf');

artSelect.addEventListener('change', () => {
  if (artSelect.value === 'SIM') {
    artInfo.style.display = 'block';
  } else {
    artInfo.style.display = 'none';
    document.getElementById('art_nome').value = '';
    document.getElementById('art_cpf').value = '';
  }
});

// Máscara simples de CPF
artCpf.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  e.target.value = v;
});

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

let idEmpresa = getCookie("idEmpresa");
let idUsuario = getCookie("idUsuario");
let valorChamado

flatpickr("#data_agendada", {
  locale: "pt", // idioma português
  dateFormat: "d/m/Y", // formato brasileiro
  disable: [
    function(date) {
      // Bloqueia sábado (6) e domingo (0)
      return date.getDay() === 0 || date.getDay() === 6;
    }
  ],
  minDate: "today"
});

const cepInput = document.getElementById('cep');
cepInput.addEventListener('input', () => {
    let value = cepInput.value.replace(/\D/g, '');
    if (value.length > 5) {
        value = value.slice(0, 5) + '-' + value.slice(5, 8);
    }
    cepInput.value = value;
});

document.getElementById('cep').addEventListener('blur', async function () {
    const cep = this.value.replace(/\D/g, '');
    if (cep.length === 8) {
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
          alert('CEP não encontrado.');
          return;
        }

        document.getElementById('estado').value = data.uf;
        document.getElementById('cidade').value = data.localidade;
        document.getElementById('bairro').value = data.bairro;
        document.getElementById('rua').value = data.logradouro;
      } catch (error) {
          alert('Erro ao buscar o endereço.');
        }
    }
});

const camposParaCalculo = [
  'produto', 'tipo_icamento', 'estado', 'cidade', 'art', 'vt', 'local', 'regiao'
];

function camposPreenchidos() {
  return camposParaCalculo.every(id => {
    const el = document.getElementById(id);
    return el && el.value.trim() !== '';
  });
}

async function calcularValor() {
  if (!camposPreenchidos()) {
    document.getElementById('valor-icamento').textContent = 'R$ 0,00';
    return;
  }

  const payload = {
    produto: document.getElementById('produto').value,
    tipo_icamento: document.getElementById('tipo_icamento').value,
    uf: document.getElementById('estado').value,
    local: document.getElementById('local').value,
    regiao: document.getElementById('regiao').value,
    art: document.getElementById('art').value,
    vt: document.getElementById('vt').value
  };

  try {
    const res = await fetch('/calcular-valor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      document.getElementById('valor-icamento').textContent = 'Erro: ' + (data.erro || 'Erro desconhecido');
      return;
    }

    valor_empresa_icamento = data.valor2;

    document.getElementById('valor-icamento').style.display = 'block';
    document.getElementById('btnCalcular').style.display = 'none';
    document.getElementById('valor-icamento').textContent = `R$ ${data.valor}`;
    valorChamado = data.valor;
  } catch {
    document.getElementById('valor-icamento').textContent = 'Erro ao conectar com o servidor.';
  }
}

document.getElementById('btnCalcular').addEventListener('click', calcularValor);

// Detecta alteração nos campos e mostra o botão novamente
camposParaCalculo.forEach(id => {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('change', () => {
      document.getElementById('btnCalcular').style.display = 'block';
      document.getElementById('valor-icamento').style.display = 'none';
    });
  }
});

async function carregarInfoUsers(id) {
  try {
    const response = await fetch(`/assistencia/${id}`)
    const result = await response.json();

    const data = {
      id: result.id,
      nome: result.nome,
      email: result.email,
      telefone: result.telefone,
      cnpj: result.cnpj
    }

    return data;
  } catch (error) {
    console.log(error)
  }
};

form.addEventListener('submit', async (e) => {
    document.querySelector('.loading-screen').style.display = 'block';
    e.preventDefault();
      
    const dataAgendada = new Date(document.getElementById('data_agendada').value);
    const agora = new Date();
    const diffHoras = (dataAgendada - agora) / (1000 * 60 * 60);
    const rua = document.getElementById('rua').value;
    const numero = document.getElementById('numero').value;
    const bairro = document.getElementById('bairro').value;
    const cidade = document.getElementById('cidade').value;
    const estado = document.getElementById('estado').value;
    const cep = document.getElementById('cep').value;
    const response = await fetch(`/assistencia/${idEmpresa}`)
    const dadosUser = await response.json();

    if (diffHoras < 48) {
        alert('A data agendada deve ter no mínimo 48 horas a partir de agora.');
        return;
    }

    const endereco = `${rua}, ${numero} - ${bairro}, ${cidade} - ${estado}, ${cep}`;
        
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
    formData.append('vt', document.getElementById('vt').value);
    formData.append('art', document.getElementById('art').value);
    formData.append('art_nome', document.getElementById('art_nome').value || '');
    formData.append('art_cpf', document.getElementById('art_cpf').value || '');
    formData.append('data_agendada', document.getElementById('data_agendada').value);
    formData.append('horario_agenda', document.getElementById('horario').value);
    formData.append('informacoes_uteis', document.getElementById('informacoes_uteis').value);
    formData.append('amount', valorChamado);
    formData.append('amount_company', valor_empresa_icamento);

    console.log(formData)
        
    const arquivos = document.getElementById('anexos').files;
    for (let i = 0; i < arquivos.length; i++) {
        formData.append('anexos', arquivos[i]);
    }
        
    const res = await fetch('/criar-chamado', {
        method: 'POST',
        body: formData
    });
        
    const result = await res.json();
        
    if (result.success) {
      document.querySelector('.loading-screen').style.display = 'none';
      mostrarAvisoSucesso();
      setTimeout(() => {
        window.location.href = '/samsung/dashboard';
      }, 3000)
    } else {
      document.querySelector('.loading-screen').style.display = 'none';
      mostrarAvisoErro();
      alert('Erro ao criar chamado: ' + result.message);
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    window.location.href = '/samsung/dashboard';
});