const nome = document.getElementById('nome');
let validNome = false;
const cep = document.getElementById('cep');
let validCep = false;
const estado = document.getElementById('estado');
let validEstado = false;
const cidade = document.getElementById('cidade');
let validCidade = false;
const bairro = document.getElementById('bairro');
let validBairro = false;
const rua = document.getElementById('rua');
let validRua = false;
const numeroRes = document.getElementById('numeroRes');
let validNumeroRes = false;
const complemento = document.getElementById('complemento');
let validComplemento = false;
const telefone = document.getElementById('telefone');
let validTelefone = false;
const cnpj = document.getElementById('cnpj');
let validCnpj = false;
const conta = document.getElementById("conta");
let validConta = false;
const agencia = document.getElementById("agencia");
let validAgencia = false;
const banco = document.getElementById("banco");
let validBanco = false;
let ispbBanco;
const razao =  document.getElementById('razao');
let validRazao = false;
const email =  document.getElementById('email');
let validEmail = false;
const senha = document.getElementById('senha');
let validSenha = false;

async function buscarISPB(nomeBanco) {
    try {
      const response = await fetch("https://brasilapi.com.br/api/banks/v1");
      if (!response.ok) {
        throw new Error("Erro ao buscar bancos.");
      }

      const bancos = await response.json();

      // Verifica se a resposta é um array válido
      if (!Array.isArray(bancos)) {
        throw new Error("Formato inesperado da resposta da API.");
      }

      // Procurando pelo banco que corresponde ao nome digitado (case insensitive)
      const banco = bancos.find(banco => {
        if (banco.name && nomeBanco) {
          return banco.name.toLowerCase().includes(nomeBanco.toLowerCase());
        }
        return false;
      });

      // Exibe o ISPB se encontrado
      if (banco) {
        ispbBanco = banco.ispb;
        return banco.ispb; // Retorna o ISPB
      } else {
        console.log("Banco não encontrado.");
        return null; // Retorna null se o banco não for encontrado
      }
    } catch (erro) {
      console.error("Erro ao buscar ISPB:", erro.message);
      return null;
    }
  }
    
nome.addEventListener('keyup', () => {
    if(nome.value.length <= 1) {
      nome.style.borderColor = 'red';
      nome.style.color = 'red';
      validNome = false;
    } else {
      nome.style.borderColor = 'green';
      nome.style.color = 'black';
      validNome = true;
    }
});

// Função para preencher os campos de endereço com base no CEP
async function preencherEndereco(cep) {
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
            rua.value = data.logradouro;
            cidade.value = data.localidade;
            estado.value = data.uf;
            bairro.value = data.bairro;

            rua.style.borderColor = 'green';
            validRua = true;
            cidade.style.borderColor = 'green';
            validCidade = true;
            estado.style.borderColor = 'green';
            validEstado = true;
            bairro.style.borderColor = 'green';
            validBairro = true;
        } else {
            console.error('CEP não encontrado');
        }
    } catch (error) {
        console.error('Ocorreu um erro ao buscar o CEP:', error);
    }
}
//Formatando o campo ce CEP
cep.addEventListener('input', () => {
    let cepNovo = cep.value.replace(/\D/g, ''); // Remover caracteres não numéricos
    
    // Verificar se o CEP tem o comprimento correto
    if (cepNovo.length === 8) {
        cepNovo = cepNovo.replace(/(\d{5})(\d{3})/, '$1-$2'); // Formatando o CEP com traços
        cep.value = cepNovo; // Atualizar o valor do campo de CEP
        // Preencher os outros campos com base no CEP
        preencherEndereco(cepNovo);
        cep.style.color = 'black';
        cep.style.borderColor = 'green';
        validCep = true
    } else if (cepNovo.length < 8) {
        cep.style.color = 'red';
        validCep = false
    }
});

numeroRes.addEventListener('keyup', () => {
  if(numeroRes.value.length < 1) {
    numeroRes.style.borderColor = 'red';
    numeroRes.style.color = 'red';
    validNumeroRes = false;
  } else {
    numeroRes.style.borderColor = 'green';
    numeroRes.style.color = 'black';
    validNumeroRes = true;
  }
});

telefone.addEventListener('input', () => {
    let telefoneValue = telefone.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    if (telefoneValue.length > 11) {
        telefoneValue = telefoneValue.slice(0, 11); // Limite o comprimento a 11 caracteres
    }

    // Formata o telefone com parênteses e traço (por exemplo, (99) 99999-9999)
    telefoneValue = telefoneValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');

    telefone.value = telefoneValue; // Define o valor formatado de volta no campo
});

telefone.addEventListener('keyup', () => {
    const telefoneValue = telefone.value.replace(/\D/g, ''); // Remove todos os caracteres não numéricos
    if(telefone.value.length <= 11) {
        telefone.setAttribute('style', 'color: red; border-color: red;')
        validTelefone = false;
    } else {
        telefone.setAttribute('style', 'color: black; border-color: green;')
        validTelefone = true;
    }
});

cnpj.addEventListener('input', () => {
    let cnpjValue = cnpj.value.replace(/\D/g, '');
    if (cnpjValue.length > 14) {
        cnpjValue = cnpjValue.slice(0, 14);
    }

    cnpjValue = cnpjValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");

    cnpj.value = cnpjValue;
});

cnpj.addEventListener('keyup', () => {
    const cnpjValue = cnpj.value.replace(/\D/g, '');
    if (cnpjValue.length !== 14) {
        cnpj.style.color = 'red';
        cnpj.style.borderColor = 'red';
        validCnpj = false;
    } else {
        cnpj.style.color = 'black';
        cnpj.style.borderColor = 'green';
        validCnpj = true;
    }
});

razao.addEventListener('keyup', () => {
  if(razao.value.length < 1) {
      razao.style.color = 'red';
      razao.style.borderColor = 'red';
      validRazao = false;
  } else {
      razao.style.color = 'black';
      razao.style.borderColor = 'green';
      validRazao = true;
  }
});

// Permitir apenas números, opcionalmente com dígito (ex: 12345-6)
conta.addEventListener("input", function () {
  let valor = this.value.replace(/\D/g, ""); // Remove não-dígitos
  if (valor.length > 5) {
    valor = valor.slice(0, 5) + "-" + valor.slice(5, 6);
    conta.style.borderColor = 'green';
    conta.style.color = 'black';
    validConta = true;
  } else {
    conta.style.borderColor = 'red';
    conta.style.color = 'red';
    validConta = 'false';
  }
  this.value = valor.slice(0, 7); // Limite máximo: 6 dígitos + hífen
});

// Agência: apenas 4 dígitos (com dígito opcional ex: 1234-5)
agencia.addEventListener("input", function () {
  let valor = this.value.replace(/\D/g, "");
  if (valor.length > 4) {
    valor = valor.slice(0, 4) + "-" + valor.slice(4, 5);
    agencia.style.borderColor = 'green';
    agencia.style.color = 'black';
    validAgencia = true;
  } else {
    agencia.style.borderColor = 'red';
    agencia.style.color = 'red';
    validAgencia = 'false';
  }
  this.value = valor.slice(0, 6); // Limite máximo: 5 caracteres com hífen
});

banco.addEventListener("blur", function () {
  const nomeBanco = banco.value;
  if (validBanco = true) {
    buscarISPB(nomeBanco);
  }
});

banco.addEventListener('keyup', () => {
  if(banco.value.length < 1) {
    banco.style.borderColor = 'red';
    banco.style.color = 'red';
    validBanco = false
  } else {
    banco.style.borderColor = 'green';
    banco.style.color = 'black';
    validBanco = true;
  }
})

email.addEventListener('keyup', () => {
    const emailValue = email.value;
    const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (!emailPattern.test(emailValue)) {
        email.setAttribute('style', 'color: red; border-color: red;');
        validEmail = false;
    } else {
        email.setAttribute('style', 'color: black; border-color: green;');
        validEmail = true;
    }
});

senha.addEventListener('keyup', () => {
    const senhaValue = senha.value;
    const minLength = 8;

    if(senhaValue.length < minLength) {
     senha.setAttribute('style', 'color:red; border-color: red;');
     validSenha = false;
    } else {
     senha.setAttribute('style', 'color:black; border-color: green; ');
     validSenha = true;
    }
});
document.querySelector('.cadastro-form').addEventListener('submit', async function (e) {
  e.preventDefault();
  
  const data = {
    nome: document.getElementById('nome').value,
    cep: document.getElementById('cep').value,
    estado: document.getElementById('estado').value,
    cidade: document.getElementById('cidade').value,
    bairro: document.getElementById('bairro').value,
    rua: document.getElementById('rua').value,
    numeroRes: document.getElementById('numeroRes').value,
    complemento: document.getElementById('complemento').value,
    telefone: document.getElementById('telefone').value,
    cnpj: document.getElementById('cnpj').value,
    razao: document.getElementById('razao').value,
    email: document.getElementById('email').value,
    conta_corrente: document.getElementById('conta').value,
    agencia: document.getElementById('agencia').value,
    banco: document.getElementById('banco').value,
    ispbBanco: ispbBanco,
    senha: document.getElementById('senha').value
  };
  
  const confirmarSenha = document.getElementById('confirmar-senha').value;
  if (data.senha !== confirmarSenha) {
    alert('As senhas não coincidem.');
    return;
  }
  
  try {
    const response = await fetch('/cadastrar-empresas-icamento', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (result.success === true) {
      alert('Cadastro realizado com sucesso!');
      // Redirecionar ou limpar formulário
    } else {
      alert('Erro no cadastro: ' + (result.error || ''));
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar requisição.');
  }
});