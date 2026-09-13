// Seleciona os elementos do formulário usados nas validações e na confirmação.
const form = document.getElementById("budget-form");
const phoneInput = document.getElementById("phone");
const dateInput = document.getElementById("date");
const nameInput = document.getElementById("name");
const serviceInput = document.getElementById("service");
const formMessage = document.getElementById("form-message");

// Seleciona os botões de filtro e os cartões de serviços automotivos.
const filterButtons = document.querySelectorAll(".filter-button");
const serviceCards = document.querySelectorAll(".service-card");

// Define a data atual como a menor data permitida para solicitar atendimento.
const today = new Date().toISOString().split("T")[0];
dateInput.min = today;

// Filtra os serviços conforme a categoria escolhida pelo usuário.
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const selectedFilter = button.dataset.filter;

    // Atualiza o destaque visual do botão selecionado.
    filterButtons.forEach(function (filterButton) {
      filterButton.classList.remove("active");
    });

    button.classList.add("active");

    // Exibe somente os cartões pertencentes à categoria selecionada.
    serviceCards.forEach(function (card) {
      const category = card.dataset.category;

      if (selectedFilter === "todos" || category === selectedFilter) {
        card.style.display = "flex";
      } else {
        card.style.display = "none";
      }
    });
  });
});

// Verifica se o telefone possui DDD e uma quantidade mínima de dígitos.
phoneInput.addEventListener("input", function () {
  const digits = phoneInput.value.replace(/\D/g, "");

  if (digits.length > 0 && digits.length < 10) {
    phoneInput.setCustomValidity(
      "Informe um telefone com DDD e pelo menos 10 dígitos."
    );
  } else {
    phoneInput.setCustomValidity("");
  }
});

// Reforça que a data preferencial não pode estar no passado.
dateInput.addEventListener("change", function () {
  if (dateInput.value && dateInput.value < today) {
    dateInput.setCustomValidity(
      "A data preferencial não pode estar no passado."
    );
  } else {
    dateInput.setCustomValidity("");
  }
});

// Trata o envio do formulário sem recarregar a página ou enviar dados a um servidor.
form.addEventListener("submit", function (event) {
  event.preventDefault();

  const phoneDigits = phoneInput.value.replace(/\D/g, "");

  // Usa as validações nativas do HTML antes de apresentar a confirmação.
  if (!form.checkValidity()) {
    formMessage.textContent =
      "Preencha todos os campos obrigatórios corretamente antes de enviar.";
    formMessage.style.color = "#b42318";
    form.reportValidity();
    return;
  }

  // Realiza uma validação complementar para o telefone informado.
  if (phoneDigits.length < 10) {
    formMessage.textContent =
      "Informe um telefone com DDD e pelo menos 10 dígitos.";
    formMessage.style.color = "#b42318";
    phoneInput.focus();
    return;
  }

  // Mantém a validação da data, mesmo que o atributo min seja alterado no HTML.
  if (dateInput.value && dateInput.value < today) {
    formMessage.textContent =
      "Escolha uma data preferencial igual ou posterior à data atual.";
    formMessage.style.color = "#b42318";
    dateInput.focus();
    return;
  }

  // Personaliza a confirmação com o primeiro nome do cliente e o serviço escolhido.
  const clientName = nameInput.value.trim().split(" ")[0];
  const selectedService = serviceInput.value;

  formMessage.textContent =
    clientName +
    ", sua solicitação para " +
    selectedService +
    " foi recebida com sucesso. A Oficina Rápida entrará em contato em breve.";
  formMessage.style.color = "#1f9d55";

  // Limpa os campos após a confirmação, pois este protótipo não salva dados.
  form.reset();
  dateInput.min = today;
});
