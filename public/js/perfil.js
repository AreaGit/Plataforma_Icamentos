// =========== FUNÇÃO PARA PEGAR COOKIES =================

function getCookie(cname) {
  const name = cname + "=";
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) == 0) {
      return c.substring(name.length);
    }
  }
  return "";
}

let idEmpresa;
let tipo = getCookie("authTipo");

if(tipo == "admin") {
  idEmpresa = getCookie("authAdminId");
} else if(tipo == "autorizado") {
  idEmpresa = getCookie("authUsuarioAutorizadoId")
} else if(tipo == "empresa") {
  idEmpresa = getCookie("authEmpresaId")
}

const form = document.getElementById("formPerfil");
const msg = document.getElementById("mensagem");

async function carregarPerfil() {
  try {
    const res = await fetch(`/empresas/${idEmpresa}`);
    const empresa = await res.json();

    document.getElementById("nome").value = empresa.nome || "";
    document.getElementById("telefone").value = empresa.telefone || "";
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    msg.textContent = "Erro ao carregar perfil.";
    msg.style.color = "red";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.textContent = "";

  const dados = {
    nome: document.getElementById("nome").value,
    telefone: document.getElementById("telefone").value,
    senha: document.getElementById("senha").value
  };

  try {
    const res = await fetch(`/empresas/${idEmpresa}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados)
    });

    const result = await res.json();

    if (result.success) {
      msg.textContent = "Perfil atualizado com sucesso!";
      msg.style.color = "green";
      document.getElementById("senha").value = "";
    } else {
      msg.textContent = "Erro ao atualizar: " + (result.error || "Desconhecido");
      msg.style.color = "red";
    }
  } catch (error) {
    console.error("Erro:", error);
    msg.textContent = "Erro na atualização.";
    msg.style.color = "red";
  }
  window.location.reload();
});

document.getElementById("voltar-btn").addEventListener("click", () => {
  window.location.href = "/samsung/dashboard";
});

carregarPerfil();
