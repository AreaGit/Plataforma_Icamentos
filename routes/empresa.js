const bcrypt = require("bcrypt");
const Empresas = require("../models/Empresas");
const Administradores = require("../models/Administradores");
const Autorizados = require("../models/Usuarios_Autorizados")
const express = require("express");
const app = express();

// GET perfil da empresa
app.get("/empresas/:id", async (req, res) => {
  try {
    const tipo = req.cookies.authTipo;
    let empresa;
    
    if(tipo == "admin") {
      empresa = await Administradores.findByPk(req.params.id);
    } else if(tipo == "autorizado") {
      empresa = await Autorizados.findByPk(req.params.id);
    } else if(tipo == "empresa") {
      empresa = await Empresas.findByPk(req.params.id);
    }

    if (!empresa) return res.status(404).json({ error: "Empresa não encontrada" });
    res.json(empresa);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar empresa" });
  }
});

// PUT atualizar perfil
app.put("/empresas/:id", async (req, res) => {
  try {
    const { nome, telefone, email, senha } = req.body;
    const tipo = req.cookies.authTipo;
    let empresa;
    
    if(tipo == "admin") {
      empresa = await Administradores.findByPk(req.params.id);
    } else if(tipo == "autorizado") {
      empresa = await Autorizados.findByPk(req.params.id);
    } else {
      empresa = await Empresas.findByPk(req.params.id);
    }
    
    if (!empresa) return res.status(404).json({ error: "Empresa não encontrada" });

    empresa.nome = nome;
    empresa.telefone = telefone;

    if (senha && senha.trim() !== "") {
      empresa.senha = await bcrypt.hash(senha, 10);
    }

    await empresa.save();

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});


module.exports = app;