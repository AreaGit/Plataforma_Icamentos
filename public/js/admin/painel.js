// API Configuration
const API_BASE_URL = ""

// API Helper
const api = {
  async get(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`)
    if (!response.ok) throw new Error("Erro na requisição")
    return response.json()
  },

  async post(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Erro na requisição")
    return response.json()
  },

  async put(endpoint, data) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Erro na requisição")
    return response.json()
  },

  async delete(endpoint) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "DELETE",
    })
    if (!response.ok) throw new Error("Erro na requisição")
    return response.json()
  },
}

// UI Helper Functions
const ui = {
  showLoading() {
    document.getElementById("loadingSpinner").classList.remove("hidden")
  },

  hideLoading() {
    document.getElementById("loadingSpinner").classList.add("hidden")
  },

  showToast(message, type = "success") {
    const toast = document.createElement("div")
    toast.className = `toast ${type}`
    toast.textContent = message

    const container = document.getElementById("toastContainer")
    container.appendChild(toast)

    setTimeout(() => {
      toast.style.animation = "slideIn 0.3s ease-out reverse"
      setTimeout(() => toast.remove(), 300)
    }, 3000)
  },

  showModal(title, content, footer = "") {
    const modalContainer = document.getElementById("modalContainer")
    modalContainer.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">${title}</h2>
          <button class="modal-close" onclick="ui.closeModal()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="modal-body">${content}</div>
        ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
      </div>
    `
    modalContainer.classList.add("show")

    modalContainer.onclick = (e) => {
      if (e.target === modalContainer) ui.closeModal()
    }
  },

  closeModal() {
    document.getElementById("modalContainer").classList.remove("show")
    setTimeout(() => {
      document.getElementById("modalContainer").innerHTML = ""
    }, 200)
  },

  formatDate(dateString) {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR")
  },

  formatarData(dateString) {
    if (!dateString) return "-";
  
    // Ajusta para o fuso horário local
    const date = new Date(dateString + "T00:00:00"); // Adiciona hora para evitar problemas de fuso horário

    return date.toLocaleDateString("pt-BR");
  },

  formatCurrency(value) {
    if (!value) return "R$ 0,00"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  },

  getStatusBadge(status) {
    const badges = {
      Pendente: "badge-pending",
      Aprovado: "badge-approved",
      Rejeitado: "badge-rejected",
    }
    return `<span class="badge ${badges[status] || "badge-pending"}">${status}</span>`
  },
}

// Router
const router = {
  currentPage: "dashboard",

  navigate(page) {
    this.currentPage = page

    // Update active nav
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item.dataset.page === page)
    })

    // Load page content
    const pageContent = document.getElementById("pageContent")
    pageContent.innerHTML = ""

    switch (page) {
      case "dashboard":
        pages.dashboard()
        break
      case "chamados":
        pages.chamados()
        break
      case "empresas":
        pages.empresas()
        break
      case "assistencias":
        pages.assistencias()
        break
      case "administradores":
        pages.administradores()
        break
    }
  },
}

// Pages Object (will be populated next)
const pages = {}

// Dashboard page implementation
pages.dashboard = async () => {
  const pageContent = document.getElementById("pageContent")

  pageContent.innerHTML = `
    <div class="stats-grid" id="statsGrid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Total de Chamados</span>
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="totalChamados">-</div>
        <div class="stat-change">Todos</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Chamados Pendentes</span>
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="chamadosPendentes">-</div>
        <div class="stat-change" id="pendentesPct">-</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Empresas Cadastradas</span>
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="totalEmpresas">-</div>
        <div class="stat-change">Ativas</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">Assistências</span>
          <div class="stat-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
        </div>
        <div class="stat-value" id="totalAssistencias">-</div>
        <div class="stat-change">Cadastradas</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Chamados Recentes</h2>
        <button class="btn btn-sm" onclick="router.navigate('chamados')">Ver Todos</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Produto</th>
              <th>Data Agendamento</th>
              <th>Status</th>
              <th>Valor</th>
            </tr>
          </thead>
          <tbody id="recentChamados">
            <tr>
              <td colspan="6" style="text-align: center; padding: 2rem;">
                Carregando chamados...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `

  try {
    ui.showLoading()

    // Fetch all data
    const [chamados, empresas, assistencias] = await Promise.all([
      api.get("/chamados"),
      api.get("/empresas"),
      api.get("/assistencias"),
    ])

    // Update stats
    document.getElementById("totalChamados").textContent = chamados.length
    const pendentes = chamados.filter((c) => c.statusAprovacao === "Pendente")
    document.getElementById("chamadosPendentes").textContent = pendentes.length
    const pendentesPct = ((pendentes.length / chamados.length) * 100).toFixed(0)
    document.getElementById("pendentesPct").textContent = `${pendentesPct}% do total`

    document.getElementById("totalEmpresas").textContent = empresas.length
    document.getElementById("totalAssistencias").textContent = assistencias.length

    // Show recent chamados (last 5)
    const recentChamados = chamados.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)

    const tbody = document.getElementById("recentChamados")
    if (recentChamados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
            Nenhum chamado encontrado
          </td>
        </tr>
      `
    } else {
      tbody.innerHTML = recentChamados
        .map(
          (chamado) => `
        <tr onclick="pages.viewChamado(${chamado.id})" style="cursor: pointer;">
          <td>#${chamado.id}</td>
          <td>${chamado.produto}</td>
          <td>${ui.formatDate(chamado.data_agenda)}</td>
          <td>${ui.getStatusBadge(chamado.status)}</td>
          <td>${ui.formatCurrency(chamado.amount)}</td>
        </tr>
      `,
        )
        .join("")
    }

    ui.hideLoading()
  } catch (error) {
    console.error("[v0] Error loading dashboard:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar dashboard", "error")
  }
}

// Chamados page implementation
pages.chamados = async () => {
  const pageContent = document.getElementById("pageContent")

  pageContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Gerenciar Chamados</h2>
      </div>

      <div class="filter-tabs">
        <button class="filter-tab active" data-filter="all" onclick="pages.filterChamados('all')">
          Todos
        </button>
        <button class="filter-tab" data-filter="Aguardando" onclick="pages.filterChamados('Aguardando')">
          Aguardando
        </button>
        <button class="filter-tab" data-filter="Agendado" onclick="pages.filterChamados('Agendado')">
          Agendado
        </button>
        <button class="filter-tab" data-filter="Finalizado" onclick="pages.filterChamados('Finalizado')">
          Finalizado
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Produto</th>
              <th>Tipo Içamento</th>
              <th>Data Agendamento</th>
              <th>Status</th>
              <th>Valor</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="chamadosTable">
            <tr>
              <td colspan="8" style="text-align: center; padding: 2rem;">
                Carregando chamados...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `

  try {
    ui.showLoading()
    const chamados = await api.get("/chamados")
    window.allChamados = chamados
    pages.renderChamados(chamados)
    ui.hideLoading()
  } catch (error) {
    console.error("[v0] Error loading chamados:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar chamados", "error")
  }
}

pages.filterChamados = (filter) => {
  // Update active tab
  document.querySelectorAll(".filter-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.filter === filter)
  })

  // Filter chamados
  const filtered =
    filter === "all" ? window.allChamados : window.allChamados.filter((c) => c.statusAprovacao === filter)
  pages.renderChamados(filtered)
}

pages.renderChamados = (chamados) => {
  const tbody = document.getElementById("chamadosTable")

  if (chamados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhum chamado encontrado
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = chamados
    .map(
      (chamado) => `
    <tr>
      <td>#${chamado.id}</td>
      <td>${chamado.produto}</td>
      <td>${chamado.tipo_icamento}</td>
      <td>${ui.formatDate(chamado.data_agenda)}</td>
      <td>${ui.getStatusBadge(chamado.status)}</td>
      <td>${ui.formatCurrency(chamado.amount)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewChamado(${chamado.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editChamado(${chamado.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.viewChamado = async (id) => {
  try {
    ui.showLoading()
    const chamado = await api.get(`/chamados/${id}`)
    ui.hideLoading()

    const content = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value">#${chamado.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Produto:</span>
          <span class="detail-value">${chamado.produto}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Tipo Içamento:</span>
          <span class="detail-value">${chamado.tipo_icamento}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Data Agendamento:</span>
          <span class="detail-value">${ui.formatDate(chamado.data_agenda)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">${ui.getStatusBadge(chamado.status)}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Endereço:</span>
          <span class="detail-value">${chamado.endereco || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Valor:</span>
          <span class="detail-value">${ui.formatCurrency(chamado.amount)}</span>
        </div>
        ${
          chamado.anexos
            ? `
          <!--<div class="detail-row">
            <span class="detail-label">Anexos:</span>
            <span class="detail-value">${chamado.anexos}</span>
          </div>-->
        `
            : ""
        }
      </div>
    `

    const footer =
      chamado.statusAprovacao === "Pendente"
        ? `
      <button class="btn btn-secondary" onclick="ui.closeModal()">Fechar</button>
      <button class="btn btn-danger" onclick="pages.updateChamadoStatus(${chamado.id}, 'Rejeitado')">
        Rejeitar
      </button>
      <button class="btn btn-success" onclick="pages.updateChamadoStatus(${chamado.id}, 'Aprovado')">
        Aprovar
      </button>
    `
        : `
      <button class="btn btn-secondary" onclick="ui.closeModal()">Fechar</button>
    `

    ui.showModal(`Chamado #${chamado.id}`, content, footer)
  } catch (error) {
    console.error("[v0] Error loading chamado details:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar detalhes do chamado", "error")
  }
}

pages.updateChamadoStatus = async (id, status) => {
  try {
    ui.closeModal()
    ui.showLoading()

    await api.put(`/chamados/${id}/status`, { statusAprovacao: status })

    ui.hideLoading()
    ui.showToast(`Chamado ${status.toLowerCase()} com sucesso`, "success")

    // Reload chamados page
    pages.chamados()
  } catch (error) {
    console.error("[v0] Error updating chamado status:", error)
    ui.hideLoading()
    ui.showToast("Erro ao atualizar status do chamado", "error")
  }
}

pages.renderChamados = (chamados) => {
  const tbody = document.getElementById("chamadosTable")

  if (chamados.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhum chamado encontrado
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = chamados
    .map(
      (chamado) => `
    <tr>
      <td>#${chamado.id}</td>
      <td>${chamado.produto}</td>
      <td>${chamado.tipo_icamento}</td>
      <td>${ui.formatarData(chamado.data_agenda)}</td>
      <td>${ui.getStatusBadge(chamado.status)}</td>
      <td>${ui.formatCurrency(chamado.amount)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewChamado(${chamado.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editChamado(${chamado.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.editChamado = async (id) => {
  try {
    ui.showLoading()
    const chamado = await api.get(`/chamados/${id}`)
    ui.hideLoading()

    const dateValue = chamado.data_agenda ? chamado.data_agenda.split("T")[0] : ""

    const content = `
      <form id="editChamadoForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label>Produto *</label>
          <select name="produto" required class="form-input">
            <option value="TELEVISOR" ${chamado.produto === "TELEVISOR" ? "selected" : ""}>TELEVISOR</option>
            <option value="GELADEIRA" ${chamado.produto === "GELADEIRA" ? "selected" : ""}>GELADEIRA</option>
          </select>
        </div>
        <div class="form-group">
          <label>Tipo de Içamento *</label>
          <!-- Changed from input text to select with predefined options -->
          <select name="tipo_icamento" required class="form-input">
            <option value="">Selecionar...</option>
            <option value="SUBIDA" ${chamado.tipo_icamento === "SUBIDA" ? "selected" : ""}>SUBIDA</option>
            <option value="DESCIDA" ${chamado.tipo_icamento === "DESCIDA" ? "selected" : ""}>DESCIDA</option>
            <option value="SUBIDA/DESCIDA" ${chamado.tipo_icamento === "SUBIDA/DESCIDA" ? "selected" : ""}>SUBIDA/DESCIDA</option>
          </select>
        </div>
        <div class="form-group">
          <label>Data de Agendamento *</label>
          <input type="date" name="data_agenda" value="${dateValue}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Endereço</label>
          <input type="text" name="endereco" value="${chamado.endereco || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Valor *</label>
          <input type="number" step="0.01" name="amount" value="${chamado.amount || ""}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Status *</label>
          <select name="status" required class="form-input">
            <option value="Aguardando" ${chamado.status === "Aguardando" ? "selected" : ""}>Aguardando</option>
            <option value="Agendado" ${chamado.status === "Agendado" ? "selected" : ""}>Agendado</option>
            <option value="Finalizado" ${chamado.status === "Finalizado" ? "selected" : ""}>Finalizado</option>
          </select>
        </div>
      </form>
    `

    const footer = `
      <button class="btn btn-secondary" onclick="ui.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="pages.saveChamado(${id})">Salvar</button>
    `

    ui.showModal(`Editar Chamado #${chamado.id}`, content, footer)
  } catch (error) {
    console.error("[v0] Error loading chamado for edit:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar chamado", "error")
  }
}

pages.saveChamado = async (id) => {
  const form = document.getElementById("editChamadoForm")
  const formData = new FormData(form)
  const data = Object.fromEntries(formData.entries())

  data.amount = Number.parseFloat(data.amount)

  if (!data.produto || !data.tipo_icamento || !data.data_agenda || !data.amount || !data.status) {
    ui.showToast("Preencha os campos obrigatórios", "error")
    return
  }

  try {
    ui.closeModal()
    ui.showLoading()

    await api.put(`/chamados/${id}`, data)

    ui.hideLoading()
    ui.showToast("Chamado atualizado com sucesso", "success")
    pages.chamados()
  } catch (error) {
    console.error("[v0] Error updating chamado:", error)
    ui.hideLoading()
    ui.showToast("Erro ao atualizar chamado", "error")
  }
}

// Empresas page implementation
pages.empresas = async () => {
  const pageContent = document.getElementById("pageContent")

  pageContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Gerenciar Empresas</h2>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome Empresa</th>
              <th>CNPJ</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="empresasTable">
            <tr>
              <td colspan="7" style="text-align: center; padding: 2rem;">
                Carregando empresas...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `

  try {
    ui.showLoading()
    const empresas = await api.get("/empresas")
    pages.renderEmpresas(empresas)
    ui.hideLoading()
  } catch (error) {
    console.error("[v0] Error loading empresas:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar empresas", "error")
  }
}

pages.renderEmpresas = (empresas) => {
  const tbody = document.getElementById("empresasTable")

  if (empresas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhuma empresa encontrada
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = empresas
    .map(
      (empresa) => `
    <tr>
      <td>#${empresa.id}</td>
      <td>${empresa.nome}</td>
      <td>${empresa.cnpj || "-"}</td>
      <td>${empresa.email}</td>
      <td>${empresa.telefone || "-"}</td>
      <td>${empresa.cidade || "-"}/${empresa.uf || "-"}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewEmpresa(${empresa.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editEmpresa(${empresa.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.viewEmpresa = async (id) => {
  try {
    ui.showLoading()
    const empresa = await api.get(`/empresas/${id}`)
    ui.hideLoading()

    const content = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value">#${empresa.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Nome Empresa:</span>
          <span class="detail-value">${empresa.nome}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CNPJ:</span>
          <span class="detail-value">${empresa.cnpj || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${empresa.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Telefone:</span>
          <span class="detail-value">${empresa.telefone || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Celular:</span>
          <span class="detail-value">${empresa.celular || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CEP:</span>
          <span class="detail-value">${empresa.cep || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Endereço:</span>
          <span class="detail-value">${empresa.endereco || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Número:</span>
          <span class="detail-value">${empresa.numero || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Bairro:</span>
          <span class="detail-value">${empresa.bairro || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cidade:</span>
          <span class="detail-value">${empresa.cidade || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">UF:</span>
          <span class="detail-value">${empresa.uf || "-"}</span>
        </div>
        ${
          empresa.asaasCustomerId
            ? `
          <div class="detail-row">
            <span class="detail-label">Asaas Customer ID:</span>
            <span class="detail-value">${empresa.asaasCustomerId}</span>
          </div>
        `
            : ""
        }
        <div class="detail-row">
          <span class="detail-label">Cadastrado em:</span>
          <span class="detail-value">${ui.formatDate(empresa.createdAt)}</span>
        </div>
      </div>
    `

    ui.showModal(
      `Empresa: ${empresa.nome}`,
      content,
      '<button class="btn btn-secondary" onclick="ui.closeModal()">Fechar</button>',
    )
  } catch (error) {
    console.error("[v0] Error loading empresa details:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar detalhes da empresa", "error")
  }
}

pages.renderEmpresas = (empresas) => {
  const tbody = document.getElementById("empresasTable")

  if (empresas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhuma empresa encontrada
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = empresas
    .map(
      (empresa) => `
    <tr>
      <td>#${empresa.id}</td>
      <td>${empresa.nome}</td>
      <td>${empresa.cnpj || "-"}</td>
      <td>${empresa.email}</td>
      <td>${empresa.telefone || "-"}</td>
      <td>${empresa.cidade || "-"}/${empresa.uf || "-"}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewEmpresa(${empresa.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editEmpresa(${empresa.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.editEmpresa = async (id) => {
  try {
    ui.showLoading()
    const empresa = await api.get(`/empresas/${id}`)
    ui.hideLoading()

    const content = `
      <form id="editEmpresaForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label>Nome da Empresa *</label>
          <input type="text" name="nome" value="${empresa.nome || ""}" required class="form-input">
        </div>
        <div class="form-group">
          <label>CNPJ</label>
          <input type="text" name="cnpj" value="${empresa.cnpj || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" name="email" value="${empresa.email || ""}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="text" name="telefone" value="${empresa.telefone || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Celular</label>
          <input type="text" name="celular" value="${empresa.celular || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>CEP</label>
          <input type="text" name="cep" value="${empresa.cep || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Endereço</label>
          <input type="text" name="endereco" value="${empresa.endereco || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Número</label>
          <input type="text" name="numero" value="${empresa.numero || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Bairro</label>
          <input type="text" name="bairro" value="${empresa.bairro || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Cidade</label>
          <input type="text" name="cidade" value="${empresa.cidade || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>UF</label>
          <input type="text" name="uf" value="${empresa.uf || ""}" maxlength="2" class="form-input">
        </div>
      </form>
    `

    const footer = `
      <button class="btn btn-secondary" onclick="ui.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="pages.saveEmpresa(${id})">Salvar</button>
    `

    ui.showModal(`Editar Empresa: ${empresa.nome}`, content, footer)
  } catch (error) {
    console.error("[v0] Error loading empresa for edit:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar empresa", "error")
  }
}

pages.saveEmpresa = async (id) => {
  const form = document.getElementById("editEmpresaForm")
  const formData = new FormData(form)
  const data = Object.fromEntries(formData.entries())

  if (!data.nome || !data.email) {
    ui.showToast("Preencha os campos obrigatórios", "error")
    return
  }

  try {
    ui.closeModal()
    ui.showLoading()

    await api.put(`/empresas/${id}`, data)

    ui.hideLoading()
    ui.showToast("Empresa atualizada com sucesso", "success")
    pages.empresas()
  } catch (error) {
    console.error("[v0] Error updating empresa:", error)
    ui.hideLoading()
    ui.showToast("Erro ao atualizar empresa", "error")
  }
}

// Assistencias page implementation
pages.assistencias = async () => {
  const pageContent = document.getElementById("pageContent")

  pageContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Gerenciar Assistências</h2>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome Empresa</th>
              <th>CNPJ</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="assistenciasTable">
            <tr>
              <td colspan="7" style="text-align: center; padding: 2rem;">
                Carregando assistências...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `

  try {
    ui.showLoading()
    const assistencias = await api.get("/assistencias")
    pages.renderAssistencias(assistencias)
    ui.hideLoading()
  } catch (error) {
    console.error("[v0] Error loading assistencias:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar assistências", "error")
  }
}

pages.renderAssistencias = (assistencias) => {
  const tbody = document.getElementById("assistenciasTable")

  if (assistencias.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhuma assistência encontrada
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = assistencias
    .map(
      (assistencia) => `
    <tr>
      <td>#${assistencia.id}</td>
      <td>${assistencia.nome}</td>
      <td>${assistencia.cnpj || "-"}</td>
      <td>${assistencia.email}</td>
      <td>${assistencia.telefone || "-"}</td>
      <td>
        <span class="badge ${assistencia.status === "Ativa" ? "badge-approved" : "badge-pending"}">
          ${assistencia.status === "Ativa" ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewAssistencia(${assistencia.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editAssistencia(${assistencia.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.viewAssistencia = async (id) => {
  try {
    ui.showLoading()
    const assistencia = await api.get(`/assistencias/${id}`)
    ui.hideLoading()

    const content = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value">#${assistencia.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Nome Empresa:</span>
          <span class="detail-value">${assistencia.nome}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">CNPJ:</span>
          <span class="detail-value">${assistencia.cnpj || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${assistencia.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Telefone:</span>
          <span class="detail-value">${assistencia.telefone || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="badge ${assistencia.status === "Ativa" ? "badge-approved" : "badge-pending"}">
              ${assistencia.status === "Ativa" ? "Ativo" : "Inativo"}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Banco:</span>
          <span class="detail-value">${assistencia.banco || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Agência:</span>
          <span class="detail-value">${assistencia.agencia || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Conta:</span>
          <span class="detail-value">${assistencia.conta || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Pix:</span>
          <span class="detail-value">${assistencia.pix || "-"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cadastrado em:</span>
          <span class="detail-value">${ui.formatDate(assistencia.createdAt)}</span>
        </div>
      </div>
    `

    ui.showModal(
      `Assistência: ${assistencia.nome}`,
      content,
      '<button class="btn btn-secondary" onclick="ui.closeModal()">Fechar</button>',
    )
  } catch (error) {
    console.error("[v0] Error loading assistencia details:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar detalhes da assistência", "error")
  }
}

pages.renderAssistencias = (assistencias) => {
  const tbody = document.getElementById("assistenciasTable")

  if (assistencias.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhuma assistência encontrada
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = assistencias
    .map(
      (assistencia) => `
    <tr>
      <td>#${assistencia.id}</td>
      <td>${assistencia.nome}</td>
      <td>${assistencia.cnpj || "-"}</td>
      <td>${assistencia.email}</td>
      <td>${assistencia.telefone || "-"}</td>
      <td>
        <span class="badge ${assistencia.status === "Ativa" ? "badge-approved" : "badge-pending"}">
          ${assistencia.status === "Ativa" ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewAssistencia(${assistencia.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editAssistencia(${assistencia.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.editAssistencia = async (id) => {
  try {
    ui.showLoading()
    const assistencia = await api.get(`/assistencias/${id}`)
    ui.hideLoading()

    const content = `
      <form id="editAssistenciaForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label>Nome da Empresa *</label>
          <input type="text" name="nome" value="${assistencia.nome || ""}" required class="form-input">
        </div>
        <div class="form-group">
          <label>CNPJ</label>
          <input type="text" name="cnpj" value="${assistencia.cnpj || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" name="email" value="${assistencia.email || ""}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Telefone</label>
          <input type="text" name="telefone" value="${assistencia.telefone || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Banco</label>
          <input type="text" name="banco" value="${assistencia.banco || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Agência</label>
          <input type="text" name="agencia" value="${assistencia.agencia || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Conta</label>
          <input type="text" name="conta" value="${assistencia.conta || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Pix</label>
          <input type="text" name="pix" value="${assistencia.pix || ""}" class="form-input">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select name="status" class="form-input">
            <option value="Ativa" ${assistencia.status === "Ativa" ? "selected" : ""}>Ativo</option>
            <option value="Inativa" ${assistencia.status === "Inativa" ? "selected" : ""}>Inativo</option>
          </select>
        </div>
      </form>
    `

    const footer = `
      <button class="btn btn-secondary" onclick="ui.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="pages.saveAssistencia(${id})">Salvar</button>
    `

    ui.showModal(`Editar Assistência: ${assistencia.nome}`, content, footer)
  } catch (error) {
    console.error("[v0] Error loading assistencia for edit:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar assistência", "error")
  }
}

pages.saveAssistencia = async (id) => {
  const form = document.getElementById("editAssistenciaForm")
  const formData = new FormData(form)
  const data = Object.fromEntries(formData.entries())

  if (!data.nome || !data.email) {
    ui.showToast("Preencha os campos obrigatórios", "error")
    return
  }

  try {
    ui.closeModal()
    ui.showLoading()

    await api.put(`/assistencias/${id}`, data)

    ui.hideLoading()
    ui.showToast("Assistência atualizada com sucesso", "success")
    pages.assistencias()
  } catch (error) {
    console.error("[v0] Error updating assistencia:", error)
    ui.hideLoading()
    ui.showToast("Erro ao atualizar assistência", "error")
  }
}

// Administradores page implementation
pages.administradores = async () => {
  const pageContent = document.getElementById("pageContent")

  pageContent.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h2 class="card-title">Gerenciar Administradores</h2>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Realizar Chamado</th>
              <th>Aprovar Chamado</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="administradoresTable">
            <tr>
              <td colspan="7" style="text-align: center; padding: 2rem;">
                Carregando administradores...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `

  try {
    ui.showLoading()
    const administradores = await api.get("/administradores")
    pages.renderAdministradores(administradores)
    ui.hideLoading()
  } catch (error) {
    console.error("[v0] Error loading administradores:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar administradores", "error")
  }
}

pages.renderAdministradores = (administradores) => {
  const tbody = document.getElementById("administradoresTable")

  if (administradores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhum administrador encontrado
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = administradores
    .map(
      (admin) => `
    <tr>
      <td>#${admin.id}</td>
      <td>${admin.nome}</td>
      <td>${admin.email}</td>
      <td>
        <span class="badge ${admin.realizar_chamados ? "badge-approved" : "badge-rejected"}">
          ${admin.realizar_chamados ? "Sim" : "Não"}
        </span>
      </td>
      <td>
        <span class="badge ${admin.aprovar_chamados ? "badge-approved" : "badge-rejected"}">
          ${admin.aprovar_chamados ? "Sim" : "Não"}
        </span>
      </td>
      <td>
        <span class="badge ${admin.ativo ? "badge-approved" : "badge-pending"}">
          ${admin.ativo ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewAdministrador(${admin.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editAdministrador(${admin.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.viewAdministrador = async (id) => {
  try {
    ui.showLoading()
    const admin = await api.get(`/administradores/${id}`)
    ui.hideLoading()

    const content = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <div class="detail-row">
          <span class="detail-label">ID:</span>
          <span class="detail-value">#${admin.id}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Nome:</span>
          <span class="detail-value">${admin.nome}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span class="detail-value">${admin.email}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Realizar Chamado:</span>
          <span class="detail-value">
            <span class="badge ${admin.realizar_chamados ? "badge-approved" : "badge-rejected"}">
              ${admin.realizar_chamados ? "Sim" : "Não"}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Aprovar Chamado:</span>
          <span class="detail-value">
            <span class="badge ${admin.aprovar_chamados ? "badge-approved" : "badge-rejected"}">
              ${admin.aprovar_chamados ? "Sim" : "Não"}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Status:</span>
          <span class="detail-value">
            <span class="badge ${admin.ativo ? "badge-approved" : "badge-pending"}">
              ${admin.ativo ? "Ativo" : "Inativo"}
            </span>
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Cadastrado em:</span>
          <span class="detail-value">${ui.formatDate(admin.createdAt)}</span>
        </div>
      </div>
    `

    ui.showModal(
      `Administrador: ${admin.nome}`,
      content,
      '<button class="btn btn-secondary" onclick="ui.closeModal()">Fechar</button>',
    )
  } catch (error) {
    console.error("[v0] Error loading administrador details:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar detalhes do administrador", "error")
  }
}

pages.renderAdministradores = (administradores) => {
  const tbody = document.getElementById("administradoresTable")

  if (administradores.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
          Nenhum administrador encontrado
        </td>
      </tr>
    `
    return
  }

  tbody.innerHTML = administradores
    .map(
      (admin) => `
    <tr>
      <td>#${admin.id}</td>
      <td>${admin.nome}</td>
      <td>${admin.email}</td>
      <td>
        <span class="badge ${admin.realizar_chamados ? "badge-approved" : "badge-rejected"}">
          ${admin.realizar_chamados ? "Sim" : "Não"}
        </span>
      </td>
      <td>
        <span class="badge ${admin.aprovar_chamados ? "badge-approved" : "badge-rejected"}">
          ${admin.aprovar_chamados ? "Sim" : "Não"}
        </span>
      </td>
      <td>
        <span class="badge ${admin.ativo ? "badge-approved" : "badge-pending"}">
          ${admin.ativo ? "Ativo" : "Inativo"}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="pages.viewAdministrador(${admin.id})">
          Ver Detalhes
        </button>
        <button class="btn btn-sm btn-primary" onclick="pages.editAdministrador(${admin.id})" style="margin-left: 0.5rem;">
          Editar
        </button>
      </td>
    </tr>
  `,
    )
    .join("")
}

pages.editAdministrador = async (id) => {
  try {
    ui.showLoading()
    const admin = await api.get(`/administradores/${id}`)
    ui.hideLoading()

    const content = `
      <form id="editAdministradorForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <div class="form-group">
          <label>Nome *</label>
          <input type="text" name="nome" value="${admin.nome || ""}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" name="email" value="${admin.email || ""}" required class="form-input">
        </div>
        <div class="form-group">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" name="realizar_chamados" ${admin.realizar_chamados ? "checked" : ""}>
            Permissão para Realizar Chamado
          </label>
        </div>
        <div class="form-group">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" name="aprovar_chamados" ${admin.aprovar_chamados ? "checked" : ""}>
            Permissão para Aprovar Chamado
          </label>
        </div>
        <div class="form-group">
          <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
            <input type="checkbox" name="ativo" ${admin.ativo ? "checked" : ""}>
            Status Ativo
          </label>
        </div>
      </form>
    `

    const footer = `
      <button class="btn btn-secondary" onclick="ui.closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="pages.saveAdministrador(${id})">Salvar</button>
    `

    ui.showModal(`Editar Administrador: ${admin.nome}`, content, footer)
  } catch (error) {
    console.error("[v0] Error loading administrador for edit:", error)
    ui.hideLoading()
    ui.showToast("Erro ao carregar administrador", "error")
  }
}

pages.saveAdministrador = async (id) => {
  const form = document.getElementById("editAdministradorForm")
  const formData = new FormData(form)

  const data = {
    nome: formData.get("nome"),
    email: formData.get("email"),
    realizar_chamados: formData.get("realizar_chamados") === "on",
    aprovar_chamados: formData.get("aprovar_chamados") === "on",
    ativo: formData.get("ativo") === "on",
  }

  if (!data.nome || !data.email) {
    ui.showToast("Preencha os campos obrigatórios", "error")
    return
  }

  try {
    ui.closeModal()
    ui.showLoading()

    await api.put(`/administradores/${id}`, data)

    ui.hideLoading()
    ui.showToast("Administrador atualizado com sucesso", "success")
    pages.administradores()
  } catch (error) {
    console.error("[v0] Error updating administrador:", error)
    ui.hideLoading()
    ui.showToast("Erro ao atualizar administrador", "error")
  }
}

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  // Setup navigation
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault()
      const page = item.dataset.page
      window.location.hash = page
      router.navigate(page)
    })
  })

  // Handle hash navigation
  window.addEventListener("hashchange", () => {
    const page = window.location.hash.slice(1) || "dashboard"
    router.navigate(page)
  })

  // Load initial page
  const initialPage = window.location.hash.slice(1) || "dashboard"
  router.navigate(initialPage)
})
