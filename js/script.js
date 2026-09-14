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

// Aplica a máscara (00) 0000-0000 ou (00) 00000-0000 enquanto o usuário digita.
phoneInput.addEventListener("input", function () {
  // Remove tudo que não for número e limita a 11 dígitos.
  let digits = phoneInput.value.replace(/\D/g, "").slice(0, 11);

  // Formata progressivamente o telefone.
  if (digits.length <= 2) {
    phoneInput.value = digits;
  } else if (digits.length <= 6) {
    phoneInput.value = "(" + digits.slice(0, 2) + ") " + digits.slice(2);
  } else if (digits.length <= 10) {
    phoneInput.value =
      "(" + digits.slice(0, 2) + ") " +
      digits.slice(2, 6) + "-" +
      digits.slice(6);
  } else {
    phoneInput.value =
      "(" + digits.slice(0, 2) + ") " +
      digits.slice(2, 7) + "-" +
      digits.slice(7);
  }

  // Valida somente quando já existe algum número informado.
  if (digits.length > 0 && (digits.length < 10 || digits.length > 11)) {
    phoneInput.setCustomValidity(
      "Informe um telefone com DDD de 10 ou 11 dígitos."
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
if (phoneDigits.length < 10 || phoneDigits.length > 11) {
  formMessage.textContent =
    "Informe um telefone com DDD de 10 ou 11 dígitos.";
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
