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

// ===========================
// VERIFICAÇÃO DE LOGIN
// ===========================

// 1️⃣ Não tem tipo? Não está logado
if (!authTipo) {
  window.location.href = "/samsung/";
}

// 2️⃣ Validar cada tipo de usuário separadamente:
let autenticado = false;
let id_usuario;

if (authTipo === "admin" && authAdminId){
  autenticado = true;
  id_usuario = authAdminId;
}

if (authTipo === "empresa" && authEmpresaId) {
  autenticado = true;
  id_usuario = authEmpresaId;
}

if (authTipo === "autorizado" && authUsuarioAutorizadoId && authEmpresaId) {
  autenticado = true;
  id_usuario = authUsuarioAutorizadoId;
}

// 3️⃣ Se nada disso for válido → não logado
if (!autenticado) {
  window.location.href = "/samsung/";
}

// ===========================
// REGRAS ESPECÍFICAS DE UI
// ===========================

// ===========================
// CARREGAR PERFIL
// ===========================
async function carregarPerfil() {
  try {
    const res = await fetch(`/empresas/${id_usuario}`);
    const empresa = await res.json();

    if(authTipo == "admin") {
      const realizar_chamados = empresa.realizar_chamados;

      if(realizar_chamados == true) {
        const btnNovo = document.querySelector(".novo-btn");
        if (btnNovo) btnNovo.style.display = "block";
      } else {
        const btnNovo = document.querySelector(".novo-btn");
        if (btnNovo) btnNovo.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    msg.textContent = "Erro ao carregar perfil.";
    msg.style.color = "red";
  }
}
// Executar
carregarPerfil();

// ===========================
// CARREGAR CHAMADOS
// ===========================
async function carregarChamados() {
  try {
    let url;

    // ADMIN → vê todos os chamados
    if (authTipo === "admin") {
      url = "/chamados";
    }

    // EMPRESA PROPRIETÁRIA → vê apenas seus chamados
    else if (authTipo === "empresa") {
      url = `/chamados_empresa/${authEmpresaId}`;
    }

    // USUÁRIO AUTORIZADO → vê chamados da empresa dele
    else if (authTipo === "autorizado") {
      url = `/chamados_empresa/${authEmpresaId}`;
    }

    else {
      console.warn("Tipo de usuário inválido. Redirecionando...");
      window.location.href = "/samsung/";
      return;
    }

    // Buscar lista de chamados
    const response = await fetch(url);
    const chamados = await response.json();

    const container = document.getElementById("chamados-lista");
    container.innerHTML = "";

    if (!chamados || chamados.length === 0) {
      container.innerHTML = `
        <div class="chamado-card">
          <p>Nenhum chamado encontrado.</p>
        </div>
      `;
      return;
    }

    chamados.forEach((ch) => {
      const card = document.createElement("div");
      card.classList.add("chamado-card");

      const statusClass = ch.status
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace("/", "-");

      card.innerHTML = `
        <div>
          <h3>Chamado #${ch.id}</h3>
          <p><strong>Data:</strong> ${ch.data_agenda || "--"}</p>
          <p><strong>Status:</strong>
            <span class="status status-${statusClass}">
              ${ch.status}
            </span>
          </p>
        </div>

        <a href="/samsung/chamado-detalhes?id=${ch.id}" class="detalhes-btn">
          Ver detalhes
        </a>
      `;

      container.appendChild(card);
    });

  } catch (err) {
    console.error("Erro ao carregar chamados:", err);
  }
}

// Executar
carregarChamados();

// ===========================
// BOTÃO PERFIL
// ===========================
document.getElementById("perfil-btn").addEventListener("click", () => {
  window.location.href = "/samsung/perfil";
});

// ===========================
// BOTÃO LOGOUT
// ===========================
document.getElementById("logout-btn").addEventListener("click", async () => {
  fetch("/logout", {
    method: "GET",
    credentials: "include"
  })
    .then((response) => {
      if (response.redirected) {
        window.location.href = response.url;
      }
    })
    .catch((err) => console.error("Erro logout:", err));
});