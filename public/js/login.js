document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email');

  // Validação dinâmica de e-mail
  emailInput.addEventListener('input', () => {
    emailInput.value = emailInput.value.trim().toLowerCase();

    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);

    if (!valido && emailInput.value !== "") {
      emailInput.classList.add("input-erro");
    } else {
      emailInput.classList.remove("input-erro");
    }
  });
});

// ============================
// Login
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const emailInput = document.getElementById('email');

  emailInput.addEventListener('input', () => {
    emailInput.value = emailInput.value.trim().toLowerCase();

    const valido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    emailInput.classList.toggle("input-erro", !valido && emailInput.value !== "");
  });

  const form = document.querySelector('.login-form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const senha = document.querySelector('#senha').value.trim();

    if (!email || !senha) {
      alert("Preencha e-mail e senha.");
      return;
    }

    try {
      const response = await fetch('/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Erro ao fazer login.");
        return;
      }

      window.location.href = "/samsung/dashboard";

    } catch (err) {
      console.error("Erro ao conectar:", err);
      alert("Falha na conexão com o servidor.");
    }
  });
});