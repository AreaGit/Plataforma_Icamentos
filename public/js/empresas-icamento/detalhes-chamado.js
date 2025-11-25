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

// ===============================
// DETALHES DO CHAMADO - FRONTEND
// ===============================

window.addEventListener('load', function() {
  // Quando a página carrega, oculta a tela de loading
  document.querySelector('.loading-screen').style.display = 'none';
});

let statusAtualChamado;

const statusSequencia = [
  "Aguardando",
  "Agendado",
  "Em Execução",
  "Finalizado"
];

const statusFinal = ["Finalizado", "No-show", "Cancelado"];

function getProximoStatus(status) {
  const idx = statusSequencia.indexOf(status);
  return idx >= 0 && idx < statusSequencia.length - 1 ? statusSequencia[idx + 1] : null;
}

function aplicarEstiloStatus(status) {
  const statusSpan = document.getElementById('status');
  statusSpan.textContent = status;

  const cores = {
    "Aguardando": "#FFC600",
    "Agendamento": "#00A9E0",
    "Agendado": "#0057B8",
    "Em Execução": "#FF6900",
    "Finalizado": "#00B140",
    "Cancelado": "#E4002B",
    "No-show": "#C800A1"
  };

  statusSpan.style.backgroundColor = cores[status] || "#888B8D";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1);
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

let tipo = "empresa";
let userId = getCookie("idEmpresa");

function configurarBotaoAvancarStatus(statusAtual, chamadoId) {
  const proximoStatus = getProximoStatus(statusAtual);
  const btn = document.getElementById('btnAvancarStatus');
  const formFinalizacao = document.getElementById('form-finalizacao');
  const form = document.getElementById("form-finalizar");

  // Esconde o botão se for "Agendado"
  if (statusAtual === "Agendado") {
    btn.style.display = "none";
    return;
  }

  if (proximoStatus && !statusFinal.includes(statusAtual)) {
    btn.style.display = 'inline-flex';
    btn.onclick = async () => {
      document.querySelector('.loading-screen').style.display = 'block';

      if (proximoStatus === "Finalizado") {
        formFinalizacao.style.display = "block";

        form.onsubmit = async (e) => {
          e.preventDefault();
          btn.textContent = "Finalizando...";
          btn.disabled = true;

          const horario = document.getElementById("horario_finalizacao").value;
          const obs = document.getElementById("obs_finalizacao").value;
          const fotos = document.getElementById("fotos_finalizacao").files;
          const cliente_presente = document.getElementById('cliente_presente').value;
          const produto_ok = document.getElementById('produto_ok').value;
          const tecnico_presente = document.getElementById('tecnico_presente').value;

          const formData = new FormData();
          formData.append("horario_finalizacao", horario);
          formData.append("obs_finalizacao", obs);
          formData.append("cliente_presente", cliente_presente);
          formData.append("produto_ok", produto_ok);
          formData.append("tecnico_presente", tecnico_presente);
          for (let i = 0; i < fotos.length; i++) {
            formData.append("fotos[]", fotos[i]);
          }

          try {
            const res = await fetch(`/empresa-icamentos/finalizar-chamado/${chamadoId}`, {
              method: "POST",
              body: formData,
            });

            if (res.ok) {
              document.querySelector('.loading-screen').style.display = 'none';
              alert("Chamado finalizado com sucesso!");
              window.location.reload(); // ✅ Recarrega após finalizar
            } else {
              alert("Erro ao finalizar chamado.");
            }
          } catch (err) {
            console.error(err);
            alert("Erro ao enviar dados.");
          }

          btn.disabled = false;
          btn.textContent = "Avançar Status";
        };

      } else {
        btn.textContent = "Atualizando...";
        btn.disabled = true;

        try {
          const res = await fetch(`/empresa-icamentos/chamado/${chamadoId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: proximoStatus })
          });

          if (res.ok) {
            document.querySelector('.loading-screen').style.display = 'none';
            aplicarEstiloStatus(proximoStatus);
            alert(`Status atualizado para "${proximoStatus}" com sucesso!`);
            window.location.reload(); // ✅ Recarrega após sucesso
          } else {
            document.querySelector('.loading-screen').style.display = 'none';
            alert("Erro ao atualizar status.");
          }
        } catch (err) {
          document.querySelector('.loading-screen').style.display = 'none';
          alert("Erro de rede.");
        }

        btn.disabled = false;
        btn.textContent = "Avançar Status";
      }
    };
  } else {
    document.querySelector('.loading-screen').style.display = 'none';
    btn.style.display = 'none';
  }
} 

async function carregarDetalhes() {
  const urlParams = new URLSearchParams(window.location.search);
  const chamadoId = urlParams.get('id');

  const res = await fetch(`/empresa-icamentos/chamado/${chamadoId}`);
  const chamado = await res.json();
  console.log(chamado);
  statusAtualChamado = chamado.status;

  // Preenche os campos
  document.getElementById('id').textContent = chamado.id;
  document.getElementById('titulo').textContent = chamado.ordem_servico;
  document.getElementById('endereco').textContent = chamado.endereco;
  document.getElementById('tipo_icamento').textContent = chamado.tipo_icamento;
  document.getElementById('data_agenda').textContent = `${chamado.data_agenda} - ${chamado.horario_agenda}`;
  document.getElementById('status').textContent = chamado.status;
  document.getElementById('observacoes').textContent = chamado.observacoes || "Nenhuma";
  document.getElementById('vt').textContent = chamado.vt || "Nenhuma";

  if (chamado.art?.toLowerCase() === "sim") {
    document.getElementById('art').innerHTML = `
      <p><strong>ART:</strong> Sim</p>
      <p><strong>Responsável:</strong> ${chamado.art_nome || "Não informado"}</p>
      <p><strong>CPF:</strong> ${chamado.art_cpf || "Não informado"}</p>
    `;
  } else {
    document.getElementById('art').innerHTML = `<p><strong>ART:</strong> Não</p>`;
  }

  aplicarEstiloStatus(chamado.status);
  configurarBotaoAvancarStatus(chamado.status, chamado.id);

  // Renderizar anexos
  const anexosContainer = document.getElementById('anexos');
  if (Array.isArray(chamado.anexos)) {
    chamado.anexos.forEach(anexo => {
      const link = document.createElement('a');
      link.href = `/download-anexo?file=${encodeURIComponent(anexo)}`;
      link.textContent = anexo.split('-').pop();
      link.classList.add('botao-download');
      link.setAttribute('download', '');
      anexosContainer.appendChild(link);
    });
  }

  // ===========================
  // SE STATUS = AGENDADO → UPLOAD DE DOCUMENTOS
  // ===========================
  if (chamado.status === "Agendado") {
    const secaoDocs = document.getElementById('documentos-adicionais');
    const btnEnviar = document.getElementById('btnEnviarDocumentos');
    secaoDocs.style.display = 'block';

    btnEnviar.addEventListener('click', async () => {
      document.querySelector('.loading-screen').style.display = 'block';
      const arquivos = document.getElementById('arquivos_documentos').files;

      if (arquivos.length === 0) {
        alert("Selecione pelo menos um arquivo antes de enviar.");
        document.querySelector('.loading-screen').style.display = 'none';
        return;
      }

      const formData = new FormData();
      for (let i = 0; i < arquivos.length; i++) {
        formData.append("arquivos_documentos", arquivos[i]);
      }

      btnEnviar.textContent = "Enviando...";
      btnEnviar.disabled = true;

      try {
        const res = await fetch(`/empresa-icamentos/chamado/${chamado.id}/documentos`, {
          method: "POST",
          body: formData
        });

        const result = await res.json();
        document.querySelector('.loading-screen').style.display = 'none';

        if (res.ok) {
          alert("Documentos enviados com sucesso!");
          window.location.reload();
          const lista = document.createElement('ul');
          result.files.forEach(f => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${f}" target="_blank">${f.split('/').pop()}</a>`;
            lista.appendChild(li);
          });
          secaoDocs.appendChild(lista);
        } else {
          alert("Erro ao enviar documentos: " + (result.error || "Erro desconhecido"));
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao enviar documentos.");
      }

      btnEnviar.textContent = "Enviar Documentos";
      btnEnviar.disabled = false;
    });
  }

  // ===========================
  // SE STATUS = EM EXECUÇÃO → FORM FINALIZAÇÃO
  // ===========================
  if (chamado.status === "Em Execução") {
    document.getElementById('form-finalizacao').style.display = 'block';
    document.getElementById('btnAvancarStatus').style.display = 'none';

    document.getElementById('btnSalvar').addEventListener('click', async () => {
      document.querySelector('.loading-screen').style.display = 'block';
      const horario = document.getElementById("horario_finalizacao").value;
      const obs = document.getElementById("obs_finalizacao").value;
      const fotos = document.getElementById("fotos_finalizacao").files;
      const cliente_presente = document.getElementById('cliente_presente').value;
      const produto_ok = document.getElementById('produto_ok').value;
      const tecnico_presente = document.getElementById('tecnico_presente').value;

      const formData = new FormData();
      formData.append("horario_finalizacao", horario);
      formData.append("obs_finalizacao", obs);
      formData.append("cliente_presente", cliente_presente);
      formData.append("produto_ok", produto_ok);
      formData.append("tecnico_presente", tecnico_presente);
      for (let i = 0; i < fotos.length; i++) {
        formData.append("fotos", fotos[i]);
      }

      const btnSalvar = document.getElementById('btnSalvar');
      btnSalvar.textContent = "Finalizando...";
      btnSalvar.disabled = true;

      try {
        const res = await fetch(`/empresa-icamentos/finalizar-chamado/${chamadoId}`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          document.querySelector('.loading-screen').style.display = 'none';
          alert("Chamado finalizado com sucesso!");
          document.getElementById('form-finalizacao').style.display = 'none';
          btnSalvar.style.display = 'none';
          window.location.reload();
        } else {
          alert("Erro ao finalizar chamado.");
        }
      } catch (err) {
        console.error(err);
        alert("Erro ao enviar dados.");
      }

      btnSalvar.disabled = false;
      btnSalvar.textContent = "Salvar Finalização";
    });
  }
}

// Executa ao carregar
carregarDetalhes();