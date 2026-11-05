let solicitacoes = []; // Armazena a lista de solicitações em memória

// Elementos do formulário
const form = document.getElementById("budget-form");
const editIdInput = document.getElementById("edit-id");
const phoneInput = document.getElementById("phone");
const dateInput = document.getElementById("date");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const vehicleInput = document.getElementById("vehicle");
const yearInput = document.getElementById("year");
const serviceInput = document.getElementById("service");
const descriptionInput = document.getElementById("description");
const formMessage = document.getElementById("form-message");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

// Elementos da tabela e painel CRUD
const tableBody = document.getElementById("crud-table-body");
const searchInput = document.getElementById("search-input");
const filterUrgencySelect = document.getElementById("filter-urgency");
const sortSelect = document.getElementById("sort-select");
const btnReloadJson = document.getElementById("btn-reload-json");

// Elementos de status do Fetch
const loadingSpinner = document.getElementById("loading-spinner");
const errorMessage = document.getElementById("error-message");

// Elementos de resumo calculado
const totalCountElem = document.getElementById("total-count");
const urgentCountElem = document.getElementById("urgent-count");
const latestDateElem = document.getElementById("latest-date");

// Elementos do filtro da seção de serviços (Mantidos do 1º Bimestre)
const filterButtons = document.querySelectorAll(".filter-button");
const serviceCards = document.querySelectorAll(".service-card");

// Configura a data limite (hoje)
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;


async function carregarDadosIniciais() {
  mostrarStatusCarregando(true);
  ocultarErro();

  try {
    // 1. Tenta recuperar do localStorage para manter edições/inclusões do usuário
    const dadosSalvos = localStorage.getItem("oficina_solicitacoes");

    if (dadosSalvos) {
      solicitacoes = JSON.parse(dadosSalvos);
    } else {
      // 2. Se não houver dados no localStorage, faz o fetch do JSON local
      const resposta = await fetch("dados.json");

      if (!resposta.ok) {
        throw new Error(`Erro HTTP ${resposta.status}: Não foi possível carregar o arquivo dados.json.`);
      }

      solicitacoes = await resposta.json();
      salvarNoLocalStorage();
    }

    atualizarInterface();
  } catch (erro) {
    exibirErro(`Falha ao carregar dados: ${erro.message}`);
    console.error("Erro no Fetch:", erro);
  } finally {
    mostrarStatusCarregando(false);
  }
}

// Recarrega o JSON original resetando as edições
btnReloadJson.addEventListener("click", async function () {
  if (confirm("Deseja restaurar as solicitações padrão do arquivo JSON? Isso apagará as edições atuais.")) {
    localStorage.removeItem("oficina_solicitacoes");
    await carregarDadosIniciais();
  }
});

function salvarNoLocalStorage() {
  localStorage.setItem("oficina_solicitacoes", JSON.stringify(solicitacoes));
}

// Status visual do Fetch
function mostrarStatusCarregando(exibir) {
  loadingSpinner.style.display = exibir ? "block" : "none";
}

function exibirErro(msg) {
  errorMessage.textContent = msg;
  errorMessage.style.display = "block";
}

function ocultarErro() {
  errorMessage.style.display = "none";
}



/**
 * Regra 1: Validação de Formato e DDD do Telefone
 */
function validarTelefone(telefone) {
  const digitos = telefone.replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 11;
}

/**
 * Regra 2: Intervalo de Datas (Não pode ser no passado nem > 90 dias no futuro)
 */
function validarDataPreferencial(dataStr) {
  if (!dataStr) return true; // Data é opcional

  const dataEscolhida = new Date(dataStr + "T00:00:00");
  const dataAtual = new Date();
  dataAtual.setHours(0, 0, 0, 0);

  const limiteFuturo = new Date();
  limiteFuturo.setDate(dataAtual.getDate() + 90);

  if (dataEscolhida < dataAtual) {
    return { valido: false, mensagem: "A data preferencial não pode estar no passado." };
  }

  if (dataEscolhida > limiteFuturo) {
    return { valido: false, mensagem: "A data preferencial não pode exceder 90 dias a contar de hoje." };
  }

  return { valido: true };
}

/**
 * Regra 3: Validação de Duplicidade e Campo Dependente
 */
function validarRegrasNegocio(dados, idEdicao) {
  // A) Validação de Duplicidade (Mesmo telefone e mesma data para a mesma pessoa)
  const duplicado = solicitacoes.some(item => {
    if (idEdicao && item.id === idEdicao) return false;
    return item.phone.replace(/\D/g, "") === dados.phone.replace(/\D/g, "") && item.date === dados.date && item.date !== "";
  });

  if (duplicado) {
    return { valido: false, mensagem: "Já existe uma solicitação cadastrada para este telefone nesta mesma data." };
  }

  // B) Campo Dependente (Se o serviço for 'Outro', a descrição deve ser detalhada)
  if (dados.service === "Outro" && dados.description.trim().length < 15) {
    return { valido: false, mensagem: "Ao selecionar o serviço 'Outro', detalhe o problema com pelo menos 15 caracteres." };
  }

  return { valido: true };
}

// Mask dinâmica para o telefone
phoneInput.addEventListener("input", function () {
  let digits = phoneInput.value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) {
    phoneInput.value = digits;
  } else if (digits.length <= 6) {
    phoneInput.value = "(" + digits.slice(0, 2) + ") " + digits.slice(2);
  } else if (digits.length <= 10) {
    phoneInput.value = "(" + digits.slice(0, 2) + ") " + digits.slice(2, 6) + "-" + digits.slice(6);
  } else {
    phoneInput.value = "(" + digits.slice(0, 2) + ") " + digits.slice(2, 7) + "-" + digits.slice(7);
  }
});


// SUBMIT DO FORMULÁRIO (Adicionar / Editar)
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const urgencyRadio = document.querySelector('input[name="urgency"]:checked');
  const idEdicao = editIdInput.value ? Number(editIdInput.value) : null;

  const dadosFormulario = {
    name: nameInput.value.trim(),
    email: emailInput.value.trim(),
    phone: phoneInput.value.trim(),
    vehicle: vehicleInput.value.trim(),
    year: yearInput.value ? Number(yearInput.value) : "",
    service: serviceInput.value,
    date: dateInput.value,
    urgency: urgencyRadio ? urgencyRadio.value : "Normal",
    description: descriptionInput.value.trim()
  };

  // 1. Validação Nátiva do HTML
  if (!form.checkValidity()) {
    exibirMensagemFormulario("Preencha todos os campos obrigatórios corretamente.", "#b42318");
    form.reportValidity();
    return;
  }

  // 2. Aplicação da Regra 1 (Telefone)
  if (!validarTelefone(dadosFormulario.phone)) {
    exibirMensagemFormulario("Informe um telefone válido com DDD (10 ou 11 dígitos).", "#b42318");
    phoneInput.focus();
    return;
  }

  // 3. Aplicação da Regra 2 (Data)
  const checagemData = validarDataPreferencial(dadosFormulario.date);
  if (!checagemData.valido) {
    exibirMensagemFormulario(checagemData.mensagem, "#b42318");
    dateInput.focus();
    return;
  }

  // 4. Aplicação da Regra 3 (Duplicidade e Campo Dependente)
  const checagemNegocio = validarRegrasNegocio(dadosFormulario, idEdicao);
  if (!checagemNegocio.valido) {
    exibirMensagemFormulario(checagemNegocio.mensagem, "#b42318");
    return;
  }

  // OPERAÇÃO CRUD: ATUALIZAR OU CRIAR
  if (idEdicao) {
    // Atualizar registro existente (Update)
    const index = solicitacoes.findIndex(item => item.id === idEdicao);
    if (index !== -1) {
      solicitacoes[index] = { ...solicitacoes[index], ...dadosFormulario };
      exibirMensagemFormulario("Solicitação atualizada com sucesso!", "#1f9d55");
    }
  } else {
    // Criar novo registro (Create)
    const novoRegistro = {
      id: Date.now(),
      ...dadosFormulario
    };
    solicitacoes.unshift(novoRegistro);
    exibirMensagemFormulario(`Solicitação enviada com sucesso para ${dadosFormulario.name.split(" ")[0]}!`, "#1f9d55");
  }

  salvarNoLocalStorage();
  atualizarInterface();
  resetarFormulario();
});

// Preenche o formulário para edição (Update)
function prepararEdicao(id) {
  const item = solicitacoes.find(s => s.id === id);
  if (!item) return;

  editIdInput.value = item.id;
  nameInput.value = item.name;
  emailInput.value = item.email || "";
  phoneInput.value = item.phone;
  vehicleInput.value = item.vehicle;
  yearInput.value = item.year || "";
  serviceInput.value = item.service;
  dateInput.value = item.date || "";
  descriptionInput.value = item.description;

  const radioUrgency = document.querySelector(`input[name="urgency"][value="${item.urgency}"]`);
  if (radioUrgency) radioUrgency.checked = true;

  submitBtn.textContent = "Salvar Alterações";
  cancelEditBtn.style.display = "inline-block";
  formMessage.textContent = "";

  // Scroll suave até o formulário
  document.getElementById("orcamento").scrollIntoView({ behavior: "smooth" });
}

// Excluir solicitação (Delete)
function excluirSolicitacao(id) {
  if (confirm("Tem certeza que deseja excluir esta solicitação?")) {
    solicitacoes = solicitacoes.filter(item => item.id !== id);
    salvarNoLocalStorage();
    atualizarInterface();
    exibirMensagemFormulario("Solicitação removida com sucesso.", "#1f9d55");
  }
}

function resetarFormulario() {
  form.reset();
  editIdInput.value = "";
  submitBtn.textContent = "Enviar solicitação";
  cancelEditBtn.style.display = "none";
  dateInput.min = today;
}

cancelEditBtn.addEventListener("click", resetarFormulario);

function exibirMensagemFormulario(msg, cor) {
  formMessage.textContent = msg;
  formMessage.style.color = cor;
}



function obterSolicitacoesFiltradasEOrdenadas() {
  const termoBusca = searchInput.value.toLowerCase().trim();
  const filtroUrgencia = filterUrgencySelect.value;
  const ordenacao = sortSelect.value;

  // 1. Filtragem por busca textual e urgência
  let resultado = solicitacoes.filter(item => {
    const combinaBusca =
      item.name.toLowerCase().includes(termoBusca) ||
      item.vehicle.toLowerCase().includes(termoBusca) ||
      item.service.toLowerCase().includes(termoBusca);

    const combinaUrgencia = filtroUrgencia === "todos" || item.urgency === filtroUrgencia;

    return combinaBusca && combinaUrgencia;
  });

  // 2. Ordenação
  if (ordenacao === "nome") {
    resultado.sort((a, b) => a.name.localeCompare(b.name));
  } else if (ordenacao === "urgencia") {
    const peso = { Urgente: 1, Prioritário: 2, Normal: 3 };
    resultado.sort((a, b) => peso[a.urgency] - peso[b.urgency]);
  } else {
    // Recentes (padrão)
    resultado.sort((a, b) => b.id - a.id);
  }

  return resultado;
}

// Renderiza as linhas da tabela no DOM
function renderizarTabela() {
  const lista = obterSolicitacoesFiltradasEOrdenadas();
  tableBody.innerHTML = "";

  if (lista.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #666;">
          Nenhuma solicitação encontrada.
        </td>
      </tr>
    `;
    return;
  }

  lista.forEach(item => {
    const tr = document.createElement("tr");

    const badgeClass = item.urgency === "Urgente" ? "badge-urgent" : item.urgency === "Prioritário" ? "badge-priority" : "badge-normal";
    const dataFormatada = item.date ? item.date.split("-").reverse().join("/") : "Não informada";

    tr.innerHTML = `
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td>${escapeHtml(item.phone)}<br><small>${escapeHtml(item.email || "-")}</small></td>
      <td>${escapeHtml(item.vehicle)} ${item.year ? `(${item.year})` : ""}</td>
      <td><span class="service-tag-table">${escapeHtml(item.service)}</span></td>
      <td><span class="urgency-badge ${badgeClass}">${escapeHtml(item.urgency)}</span></td>
      <td>${dataFormatada}</td>
      <td>
        <div class="action-buttons">
          <button class="btn-action btn-edit" type="button" onclick="prepararEdicao(${item.id})">✏ Edit</button>
          <button class="btn-action btn-delete" type="button" onclick="excluirSolicitacao(${item.id})">🗑 Excluir</button>
        </div>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// Resumo Calculado (Métricas dinamicas)
function atualizarResumoCalculado() {
  const total = solicitacoes.length;
  const urgentes = solicitacoes.filter(s => s.urgency === "Urgente" || s.urgency === "Prioritário").length;

  const datasValidas = solicitacoes.map(s => s.date).filter(Boolean).sort();
  const ultimaData = datasValidas.length > 0 ? datasValidas[datasValidas.length - 1].split("-").reverse().join("/") : "-";

  totalCountElem.textContent = total;
  urgentCountElem.textContent = urgentes;
  latestDateElem.textContent = ultimaData;
}

function atualizarInterface() {
  renderizarTabela();
  atualizarResumoCalculado();
}

// Auxiliar para evitar injeção XSS no DOM
function escapeHtml(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// Eventos de Busca, Filtro e Ordenação
searchInput.addEventListener("input", renderizarTabela);
filterUrgencySelect.addEventListener("change", renderizarTabela);
sortSelect.addEventListener("change", renderizarTabela);


filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    serviceCards.forEach(card => {
      const category = card.dataset.category;
      if (selectedFilter === "todos" || category === selectedFilter) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
});

// Inicialização da Aplicação ao carregar o DOM
document.addEventListener("DOMContentLoaded", carregarDadosIniciais);
