// ===========================
// GET COOKIE
// ===========================
function getCookie(cname) {
  const name = cname + "=";
  const decoded = decodeURIComponent(document.cookie);
  const parts = decoded.split(";");

  for (let p of parts) {
    while (p.charAt(0) === " ") p = p.substring(1);
    if (p.indexOf(name) === 0) return p.substring(name.length);
  }
  return "";
}

// ===========================
// COOKIES VINDOS DO LOGIN
// ===========================
const authTipo = getCookie("authTipo");                           // admin / empresa / autorizado
const authAdminId = getCookie("authAdminId");                     // se admin
const authEmpresaId = getCookie("authEmpresaId");                 // se empresa OU se autorizado
const authUsuarioAutorizadoId = getCookie("authUsuarioAutorizadoId"); // se autorizado

// Flags de papel
const isAdmin = authTipo === "admin" && !!authAdminId;
const isEmpresa = authTipo === "empresa" && !!authEmpresaId;
const isAutorizado = authTipo === "autorizado" && !!authUsuarioAutorizadoId && !!authEmpresaId;

// Usuário atual genérico
let currentUserId = null;
if (isAdmin) currentUserId = Number(authAdminId);
else if (isAutorizado) currentUserId = Number(authUsuarioAutorizadoId);
else if (isEmpresa) currentUserId = Number(authEmpresaId);

// 1️⃣ Não tem tipo ou não conseguimos montar o userId? Não está logado
if (!authTipo || !currentUserId) {
  window.location.href = "/samsung/";
}

/* ============================================================
                    ELEMENTOS DOS MODAIS E TOAST
============================================================ */
const modalAprovar = document.getElementById("modalAprovar");
const modalRejeicao = document.getElementById("modalRejeicao");

const toastSucesso = document.getElementById("toast-sucesso");
const toastErro = document.getElementById("toast-erro");

/* ============================================================
                    FUNÇÃO TOAST
============================================================ */
function mostrarToast(elemento, mensagemOpcional) {
  if (mensagemOpcional) elemento.textContent = mensagemOpcional;
  elemento.classList.add("mostrar");
  setTimeout(() => elemento.classList.remove("mostrar"), 3000);
}

/* ============================================================
                    MODAIS
============================================================ */
function abrirModalAprovar() { modalAprovar.classList.add("active"); }
function fecharModalAprovar() { modalAprovar.classList.remove("active"); }

function abrirModalRejeicao() { modalRejeicao.classList.add("active"); }
function fecharModalRejeicao() { modalRejeicao.classList.remove("active"); }

/* ============================================================
                    LOAD PRINCIPAL
============================================================ */
document.addEventListener("DOMContentLoaded", async () => {

  // -------------------------
  // PEGAR ID DO CHAMADO
  // -------------------------
  const params = new URLSearchParams(window.location.search);
  const chamadoId = params.get("id");

  if (!chamadoId) {
    alert("Chamado inválido");
    return;
  }

  let chamado;
  try {
    const res = await fetch(`/chamado/${chamadoId}`);
    if (!res.ok) throw new Error("Erro ao carregar chamado");
    chamado = await res.json();
  } catch (e) {
    console.error(e);
    alert("Erro ao carregar chamado");
    return;
  }

  // -------------------------
  // PREENCHER CAMPOS
  // -------------------------
  document.getElementById("chamado-id").textContent = "#" + chamado.id;
  document.getElementById("chamado-status").textContent = chamado.status || "-";
  document.getElementById("chamado-ordem").textContent = chamado.ordem_servico || "-";
  document.getElementById("chamado-tipo").textContent = chamado.tipo_icamento || "-";
  document.getElementById("chamado-produto").textContent = chamado.produto || "-";
  document.getElementById("chamado-vt").textContent = chamado.vt || "-";
  document.getElementById("chamado-art").textContent = chamado.art || "-";

  // data_agenda pode vir como Date ou string formatada, então tratamos simples
  const dataAgendada = chamado.data_agenda || "";
  const horarioAgenda = chamado.horario_agenda || "";
  document.getElementById("chamado-data").textContent = `${dataAgendada} ${horarioAgenda}`.trim();

  document.getElementById("chamado-endereco").textContent = chamado.endereco || "-";

  // boleto
  const boletoEl = document.getElementById("chamado-boleto");
  if (chamado.boletoUrl && chamado.boletoUrl !== "a emitir") {
    boletoEl.innerHTML = `<a href="${chamado.boletoUrl}" target="_blank">Acesse Aqui</a>`;
  } else {
    boletoEl.textContent = "A emitir";
  }

  // -------------------------
  // ANEXOS
  // -------------------------
  const anexosContainer = document.getElementById("chamado-anexos");

  if (Array.isArray(chamado.anexos) && chamado.anexos.length > 0) {
    chamado.anexos.forEach(path => {
      const nomeArquivo = decodeURIComponent(String(path).split("/").pop());

      const btn = document.createElement("button");
      btn.classList.add("botao-download");
      btn.innerHTML = `📎 <span>${nomeArquivo}</span>`;

      btn.onclick = async () => {
        btn.disabled = true;
        btn.innerHTML = "⏳ Baixando...";

        try {
          const resp = await fetch(`/download/${encodeURIComponent(nomeArquivo)}`);
          if (!resp.ok) throw new Error("Erro no download");

          const blob = await resp.blob();
          const url = window.URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = nomeArquivo;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);

          btn.innerHTML = `✅ <span>${nomeArquivo}</span>`;
        } catch (err) {
          console.error(err);
          btn.innerHTML = `❌ Erro ao baixar`;
        } finally {
          setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = `📎 <span>${nomeArquivo}</span>`;
          }, 1500);
        }
      };

      anexosContainer.appendChild(btn);
    });
  } else {
    anexosContainer.innerHTML = "<p>Nenhum anexo enviado.</p>";
  }

  // ============================================================
  //              ÁREA DE APROVAÇÃO (SOMENTE ADMIN)
  // ============================================================
  const areaAprovacao = document.getElementById("areaAprovacao");

  // Admin pode aprovar/rejeitar o chamado, se estiver pendente
  const aprovadoPendente =
    chamado.aprovacao_status === "Pendente" ||
    chamado.status === "Aguardando Aprovação";

  if (isAdmin && aprovadoPendente) {
    areaAprovacao.style.display = "block";
  } else {
    areaAprovacao.style.display = "none";
  }

  // Botões de aprovação só terão efeito se for admin
  const btnAprovar = document.getElementById("btnAprovar");
  const btnRejeitar = document.getElementById("btnRejeitar");
  const btnCancelarAprovacao = document.getElementById("btnCancelarAprovacao");
  const btnConfirmarAprovacao = document.getElementById("btnConfirmarAprovacao");
  const btnCancelarRejeicao = document.getElementById("btnCancelarRejeicao");
  const btnConfirmarRejeicao = document.getElementById("btnConfirmarRejeicao");

  if (btnAprovar) btnAprovar.onclick = () => { if (isAdmin) abrirModalAprovar(); };
  if (btnRejeitar) btnRejeitar.onclick = () => { if (isAdmin) abrirModalRejeicao(); };
  if (btnCancelarAprovacao) btnCancelarAprovacao.onclick = fecharModalAprovar;
  if (btnCancelarRejeicao) btnCancelarRejeicao.onclick = fecharModalRejeicao;

  if (btnConfirmarAprovacao) {
    btnConfirmarAprovacao.onclick = async () => {
      if (!isAdmin) return;

      try {
        const resp = await fetch(`/chamado/${chamado.id}/aprovar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId: Number(authAdminId) })
        });
        const data = await resp.json();

        if (resp.ok) {
          mostrarToast(toastSucesso, "Chamado aprovado com sucesso!");
          fecharModalAprovar();
          setTimeout(() => location.reload(), 800);
        } else {
          mostrarToast(toastErro, data.error || "Erro ao aprovar");
        }
      } catch (err) {
        console.error(err);
        mostrarToast(toastErro, "Erro ao aprovar chamado");
      }
    };
  }

  if (btnConfirmarRejeicao) {
    btnConfirmarRejeicao.onclick = async () => {
      if (!isAdmin) return;

      const motivo = document.getElementById("motivoRejeicaoInput").value.trim();
      if (!motivo) {
        mostrarToast(toastErro, "Digite o motivo da rejeição");
        return;
      }

      try {
        const resp = await fetch(`/chamado/${chamado.id}/rejeitar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aprovadorId: Number(authAdminId),
            motivo
          })
        });
        const data = await resp.json();

        if (resp.ok) {
          mostrarToast(toastSucesso, "Chamado rejeitado com sucesso!");
          fecharModalRejeicao();
          setTimeout(() => location.reload(), 800);
        } else {
          mostrarToast(toastErro, data.error || "Erro ao rejeitar");
        }
      } catch (err) {
        console.error(err);
        mostrarToast(toastErro, "Erro ao rejeitar chamado");
      }
    };
  }

  // ============================================================
  //                PROPOSTA DE NOVA DATA
  // ============================================================
  const divPropor = document.getElementById("propor-data");
  const divNovaProposta = document.getElementById("nova-data-proposta");
  const btnAceitarProposta = document.getElementById("btnAceitarProposta");
  const btnProporOutraData = document.getElementById("btnProporOutraData");
  const btnProporNovaData = document.getElementById("btnProporNovaData");

  // Todos os papéis (admin, empresa, autorizado) podem propor nova data
  const tipoUsuario = authTipo; // "admin" | "empresa" | "autorizado"
  const userId = currentUserId;

  // Somente se o chamado estiver em status que faça sentido negociar data
  if (chamado.status === "Aguardando" || chamado.status === "Aguardando Agendamento" || chamado.status === "Aguardando Execução") {

    // Caso já exista nova data proposta
    if (chamado.nova_data_proposta) {
      divNovaProposta.style.display = "block";

      const dt = new Date(chamado.nova_data_proposta);
      document.getElementById("data-proposta").textContent = dt.toLocaleString("pt-BR");

      // Verifica se foi outro usuário que propôs, para poder aceitar
      const outroUsuario =
        String(chamado.proponenteId) !== String(userId) ||
        String(chamado.tipoProponente) !== String(tipoUsuario);

      if (outroUsuario && btnAceitarProposta) {
        btnAceitarProposta.style.display = "inline-block";
        btnAceitarProposta.onclick = async () => {
          try {
            const resp = await fetch(`/chamado/${chamado.id}/aceitar-proposta`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId, tipo: tipoUsuario })
            });
            const data = await resp.json();

            if (resp.ok) {
              mostrarToast(toastSucesso, "Proposta de nova data aceita!");
              setTimeout(() => location.reload(), 800);
            } else {
              mostrarToast(toastErro, data.error || "Erro ao aceitar proposta");
            }
          } catch (err) {
            console.error(err);
            mostrarToast(toastErro, "Erro ao aceitar proposta");
          }
        };
      }
    } else {
      // Ainda não há proposta → pode propor diretamente
      divPropor.style.display = "block";
    }

    if (btnProporOutraData) {
      btnProporOutraData.onclick = () => {
        divNovaProposta.style.display = "none";
        divPropor.style.display = "block";
      };
    }

    if (btnProporNovaData) {
      btnProporNovaData.onclick = async () => {
        const data = document.getElementById("data_input").value;
        const hora = document.getElementById("hora_input").value;

        if (!data || !hora) {
          mostrarToast(toastErro, "Selecione data e horário.");
          return;
        }

        const novaDataHora = `${data}T${hora}:00`;

        try {
          const resp = await fetch(`/chamado/${chamado.id}/propor-data`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ novaDataHora, userId, tipo: tipoUsuario })
          });
          const dataResp = await resp.json();

          if (resp.ok) {
            mostrarToast(toastSucesso, "Nova data proposta com sucesso!");
            setTimeout(() => location.reload(), 800);
          } else {
            mostrarToast(toastErro, dataResp.error || "Erro ao propor nova data");
          }
        } catch (err) {
          console.error(err);
          mostrarToast(toastErro, "Erro ao propor nova data");
        }
      };
    }
  } else {
    // Status que não permite proposta
    divPropor.style.display = "none";
    divNovaProposta.style.display = "none";
  }

});