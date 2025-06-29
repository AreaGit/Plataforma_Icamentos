document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const chamadoId = urlParams.get('id');

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

let tipo = "cliente";
let userId = getCookie("idEmpresa");
  
  if (!chamadoId) return;
  
  const res = await fetch(`/chamado/${chamadoId}`);
  if (!res.ok) return alert('Erro ao carregar detalhes');
  
  const chamado = await res.json();

  document.getElementById('chamado-id').textContent = '#' + chamado.id;
  document.getElementById('chamado-status').textContent = chamado.status;
  document.getElementById('chamado-ordem').textContent = chamado.ordem_servico;
  document.getElementById('chamado-tipo').textContent = chamado.tipo_icamento;
  document.getElementById('chamado-produto').textContent = chamado.produto;
  document.getElementById('chamado-vt').textContent = chamado.vt;
  document.getElementById('chamado-art').textContent = chamado.art;
  document.getElementById('chamado-data').textContent = `${chamado.data_agenda} - ${chamado.horario_agenda}`;
  document.getElementById('chamado-endereco').textContent = chamado.endereco;
  document.getElementById('chamado-boleto').innerHTML = `<a href="${chamado.boletoUrl}" target="_blank">Acesse Aqui</a>`;

  // Mostrar campos de data apenas se o status for "Aguardando"
if (chamado.status === "Aguardando") {
  const divPropor = document.getElementById('propor-data');
  const divNovaProposta = document.getElementById('nova-data-proposta');

   if (chamado.nova_data_proposta) {
    document.getElementById('nova-data-proposta').style.display = 'block';
    const dt = new Date(chamado.nova_data_proposta);
    document.getElementById('data-proposta').textContent = dt.toLocaleString('pt-BR');
    document.getElementById('propor-data').style.display = 'none';

    // Mostrar botão "Aceitar Proposta" somente se o usuário NÃO for o proponente
    const btnAceitar = document.getElementById('btnAceitarProposta');
    if (chamado.proponenteId != userId || chamado.tipoProponente != tipo) {
      btnAceitar.style.display = 'inline-block';
      btnAceitar.onclick = async () => {
        const res = await fetch(`/chamado/${chamado.id}/aceitar-proposta`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, tipo })
        });

        if (res.ok) {
          alert("Nova data aceita!");
          window.location.reload();
        } else {
          const data = await res.json();
          alert("Erro ao aceitar proposta: " + (data.error || 'Erro desconhecido'));
        }
      };
    } else {
      btnAceitar.style.display = 'none';
    }

  } else {
    document.getElementById('nova-data-proposta').style.display = 'none';
    document.getElementById('propor-data').style.display = 'block';
  }

  document.getElementById('btnProporOutraData').onclick = () => {
    document.getElementById('nova-data-proposta').style.display = 'none';
    document.getElementById('propor-data').style.display = 'block';
  };

  document.getElementById("btnProporNovaData").onclick = async () => {
    const data = document.getElementById("data_input").value;
    const hora = document.getElementById("hora_input").value;
    if (!data || !hora) return alert("Escolha uma data e horário válido.");

    const novaDataHora = `${data}T${hora}:00`;

    const res = await fetch(`/chamado/${chamado.id}/propor-data`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ novaDataHora, userId, tipo })
    });

    if (res.ok) {
      alert("Nova data proposta com sucesso.");
      window.location.reload();
    } else {
      const data = await res.json();
      alert("Erro: " + data.error);
    }
  };
}
  
  const anexos = chamado.anexos;
  const anexosContainer = document.getElementById('chamado-anexos');

  anexos.forEach(path => {
    const nomeArquivo = decodeURIComponent(path.split('/').pop());

    const botao = document.createElement('button');
    botao.classList.add('botao-download');
    botao.innerHTML = `📎 <span>${nomeArquivo}</span>`;

    botao.onclick = async () => {
      botao.disabled = true;
      botao.classList.add('loading');
      botao.innerHTML = '⏳ Baixando...';

      try {
        const res = await fetch(`/download/${encodeURIComponent(nomeArquivo)}`);
        if (!res.ok) throw new Error('Erro no download');

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = nomeArquivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        botao.innerHTML = `✅ <span>${nomeArquivo}</span>`;
      } catch (err) {
        console.error(err);
        botao.innerHTML = `❌ <span>Erro ao baixar</span>`;
      } finally {
        botao.disabled = false;
        botao.classList.remove('loading');
      }
    };

    anexosContainer.appendChild(botao);
  });
});