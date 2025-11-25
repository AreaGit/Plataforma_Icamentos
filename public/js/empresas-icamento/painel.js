function get_cookie(cname) {
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

function clearAllCookies() {
    // Pega todos os cookies como uma string única
    const cookies = document.cookie.split(';');

    // Itera sobre cada cookie
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        // Remove espaços em branco do início da string do cookie
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        
        // Define o cookie com uma data de expiração no passado
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
}

let id_empresa = get_cookie("id_empresa");
// let id_usuario = get_cookie("idUsuario");

if (!id_empresa) {
  clearAllCookies();
  window.location.href = `/samsung/empresas-icamento/login`;
}

async function carregarChamados(filtros = {}) {
  const params = new URLSearchParams(filtros).toString();
  const res = await fetch(`/empresa-icamentos/chamados?${params}`);
  const chamados = await res.json();

  // ✅ Ordena por data_agenda em ordem decrescente
  chamados.sort((a, b) => new Date(b.data_agenda) - new Date(a.data_agenda));

  const tbody = document.getElementById('listaChamados');
  tbody.innerHTML = '';

  chamados.forEach(chamado => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${chamado.id}</td>
      <td>${chamado.ordem_servico}</td>
      <td>${chamado.endereco}</td>
      <td>${chamado.data_agenda}</td>
      <td>${chamado.status}</td>
      <td><button onclick="window.location.href='/samsung/empresas-icamento/chamado?id=${chamado.id}'">Ver</button></td>
    `;
    tbody.appendChild(tr);
  });
}

document.querySelector('button').addEventListener('click', () => {
  const status = document.getElementById('filtroStatus').value;
  const dataInicio = document.getElementById('filtroDataInicio').value;
  const dataFim = document.getElementById('filtroDataFim').value;
  
  const filtros = {};
  if (status) filtros.status = status;
  if (dataInicio) filtros.dataInicio = dataInicio;
  if (dataFim) filtros.dataFim = dataFim;
  
  carregarChamados(filtros);
});

// Carrega todos inicialmente
carregarChamados();