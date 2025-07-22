const axios = require('axios');
require('dotenv').config();
const asaas_key = ('$aact_prod_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjBlOWNhZWExLWUwNDItNGJkMC1hNGQxLTE0NTIwZDdlNzA2Yzo6JGFhY2hfZmI5YjJjMzEtY2VjZi00Y2VkLWI0ZjUtNWZhMmNhZGY4NjA5');

if(asaas_key) {
    console.log("PRODUÇÃO")
}

/*

EXEMPLO DE RESPONSE DE CLIENTE CRIADO EM AMBIENTE SANDBOX DO ASAAS

{
  object: 'customer',
  id: 'cus_000006781945',
  dateCreated: '2025-06-17',
  name: 'Cliente Teste',
  email: 'clienteteste@gmail.com',
  company: 'Empresa Teste',
  phone: '4738010919',
  mobilePhone: '47999376637',
  address: 'Av. Paulista',
  addressNumber: '150',
  complement: 'Sala 201',
  province: 'Centro',
  postalCode: '01310000',
  cpfCnpj: '24971563792',
  personType: 'FISICA',
  deleted: false,
  additionalEmails: null,
  externalReference: '12987382',
  notificationDisabled: true,
  observations: null,
  municipalInscription: null,
  stateInscription: null,
  canDelete: true,
  cannotBeDeletedReason: null,
  canEdit: true,
  cannotEditReason: null,
  city: 15873,
  cityName: 'São Paulo',
  state: 'SP',
  country: 'Brasil',
  groups: [ { name: 'Grupo Teste' } ]
}

*/

// Criação de Cliente
async function criarClienteAsaas(dadosCliente) {
    const options = {
    method: 'POST',
    url: 'https://api.asaas.com/v3/customers',
    headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: asaas_key
    },
    data: {
        name: dadosCliente.name,
        cpfCnpj: dadosCliente.document,
        email: dadosCliente.email,
        phone: dadosCliente.phone,
        mobilePhone: dadosCliente.phone,
        address: dadosCliente.address,
        addressNumber: dadosCliente.addressNumber,
        complement: dadosCliente.complement,
        province: dadosCliente.province,
        postalCode: dadosCliente.postalCode,
        externalReference: dadosCliente.externalReference,
        notificationDisabled: true,
        groupName: 'Grupo Içamentos SSG',
        company: 'Area'
    }
    };

    try {
        const res = await axios.request(options);
        return res.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

// criarClienteAsaas();

// Consultar um único cliente
async function consultarClienteAsaas() {
    const options = {
        method: 'GET',
        url: 'https://api.asaas.com/v3/customers/cus_000006781945',
        headers: {
            accept: 'application/json',
            access_token: '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFiMGMyMDY2LTI4NjYtNGVkNy1iZWU2LTQ4YTYzODJhNWNjZDo6JGFhY2hfYzg1NjMyNTQtMTU1OS00MTFhLWI0MzEtYTg3ODBmZTYwMDNm'
        }
    };
    
    axios
    .request(options)
    .then(res => console.log(res.data))
    .catch(err => console.error(err));
};

// consultarClienteAsaas();

async function removerClienteAsaas() {
    const options = {
        method: 'DELETE',
        url: 'https://api.asaas.com/v3/customers/cus_000123749298',
        headers: {accept: 'application/json', access_token: asaas_key}
    };

    axios
    .request(options)
    .then(res => console.log(res.data))
    .catch(err => console.error(err));
}

// removerClienteAsaas();

// Cobranças via boleto
async function cobrancaBoletoAsaas(dadosCliente) {
    const options = {
        method: 'POST',
        url: 'https://api.asaas.com/v3/payments',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            access_token: asaas_key
        },
        data: {
            billingType: 'BOLETO',
            customer: dadosCliente.customer,
            value: dadosCliente.value,
            dueDate: dadosCliente.dueDate,
            description: dadosCliente.description,
            daysAfterDueDateToRegistrationCancellation: 1
        }
    };
    
    try {
        const res = await axios.request(options);
        console.log(res.data);  
        return res.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

// cobrancaBoletoAsaas();

// Cobranças via Pix
async function cobrancaPixAsaas() {
    const options = {
        method: 'POST',
        url: 'https://api.asaas.com/v3/payments',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            access_token: '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFiMGMyMDY2LTI4NjYtNGVkNy1iZWU2LTQ4YTYzODJhNWNjZDo6JGFhY2hfYzg1NjMyNTQtMTU1OS00MTFhLWI0MzEtYTg3ODBmZTYwMDNm'
        },
        data: {
            billingType: 'PIX',
            customer: 'cus_000006781945',
            value: 5,
            dueDate: '2025-06-17',
            description: 'Pedido 056984'
        }
        };

        axios
        .request(options)
        .then(res => console.log(res.data))
        .catch(err => console.error(err));
}

// cobrancaPixAsaas();

// Cobrança via Cartão de Crédito
async function cobrancaCartaoAsaas() {
    const options = {
    method: 'POST',
    url: 'https://api.asaas.com/v3/payments/',
    headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: '$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OmFiMGMyMDY2LTI4NjYtNGVkNy1iZWU2LTQ4YTYzODJhNWNjZDo6JGFhY2hfYzg1NjMyNTQtMTU1OS00MTFhLWI0MzEtYTg3ODBmZTYwMDNm'
    },
    data: {
        billingType: 'CREDIT_CARD',
        value: 5,
        dueDate: '2025-06-18',
        description: 'Pedido 056984',
        remoteIp: '10.0.0.118',
        customer: 'cus_000006781945',
        creditCard: {
            holderName: 'Cliente Teste',
            number: '5299288950499921',
            expiryMonth: '7',
            expiryYear: '2027',
            ccv: '936'
        },
        creditCardHolderInfo: {
        name: 'Cliente Teste',
        email: 'clienteteste@gmail.com',
        cpfCnpj: '12345678901',
        postalCode: '12345678',
        addressNumber: '123',
        phone: '51999999999'
    }
    }
    };

    axios
    .request(options)
    .then(res => console.log(res.data))
    .catch(err => console.error(err));
}

// cobrancaCartaoAsaas();

// Agendar NFS-e
async function agendarNfsAsaas(dadosNfs) {
    const options = {
        method: 'POST',
        url: 'https://api.asaas.com/v3/invoices',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            access_token: asaas_key
        },
        data: {
            taxes: {retainIss: false, cofins: 1, csll: 1, inss: 1, ir: 1, pis: 1, iss: 5},
            payment: dadosNfs.payment,
            installment: null,
            customer: dadosNfs.customer,
            serviceDescription: 'Nf referente ao Chamado Içamento SSG',
            observations: 'Nf referente ao Chamado Içamento SSG',
            externalReference: dadosNfs.externalReference,
            value: dadosNfs.value,
            deductions: 0,
            effectiveDate: dadosNfs.effectiveDate,
            municipalServiceId: null,
            municipalServiceCode: '16.01',
            municipalServiceName: 'AGENCIAMENTO DE TRANSPORTE',
            updatePayment: null
        }
    };
    
    try {
        const res = await axios.request(options);
        console.log(res.data);  
        return res.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

// Emitir NFS-e
async function emitirNfs(invoice) {
    const options = {
    method: 'POST',
    url: `https://api.asaas.com/v3/invoices/${invoice}/authorize`,
    headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        access_token: asaas_key

    }
    };

    try {
        const res = await axios.request(options);
        console.log(res.data);  
        return res.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
};

async function listarNfs(externalReference) {
    const options = {
    method: 'GET',
    url: `https://api.asaas.com/v3/invoices?externalReference=${externalReference}`,
    headers: {
        accept: 'application/json',
        access_token: asaas_key

    }
    };

    try {
        const res = await axios.request(options);
        console.log(res.data);  
        return res.data;
    } catch (err) {
        console.error(err);
        throw err;
    }
}

async function consultarNf(externalReference) {
  while (true) {
    const response = await listarNfs(externalReference);

    if (Array.isArray(response.data)) {
      const nota = response.data.find(nf => nf.status === 'AUTHORIZED');
      if (nota) return nota;
    }

    await new Promise(resolve => setTimeout(resolve, 1000)); // aguarda 1s antes de tentar novamente
  }
}

module.exports = { criarClienteAsaas, cobrancaBoletoAsaas, agendarNfsAsaas, emitirNfs, consultarNf }