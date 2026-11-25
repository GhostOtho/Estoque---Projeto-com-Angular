// Importa o Express para criar o servidor e as rotas HTTP.
const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors());

// Permite ler o corpo das requisições em formato JSON (`req.body`).
app.use(express.json());

// Usuário pré-cadastrado em memória para testar o login.
const usuarioValido = {
  usuario: 'admin',
  senha: '123',
};

// Lista de tokens válidos gerados após o login.
const tokensAtivos = [];

// Produtos pré-cadastrados em memória.
let produtos = [
  {
    id: 1,
    nome: 'Teclado Mecânico',
    preco: 250,
    categoria: 'Periféricos',
    fornecedor: 'KeyTech',
    quantidade: 8,
  },
];
let proximoId = 2;

// Rota de login: confere usuário e senha e devolve um token.
app.post('/login', (req, res) => {
  const { usuario, senha } = req.body;

  if (usuario !== usuarioValido.usuario || senha !== usuarioValido.senha) {
    return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
  }

  const token = `token-${Date.now()}`;
  tokensAtivos.push(token);

  return res.json({ token });
});

// Middleware que confere o token antes de deixar entrar nas rotas do CRUD.
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ erro: 'Token obrigatório.' });
  }

  // Espera "Bearer <token>" e separa a segunda parte.
  const token = authHeader.split(' ')[1];

  // `(item) => item === token` é uma função que procura na lista se esse token é válido.
  const valido = tokensAtivos.find((item) => item === token);

  if (!valido) {
    return res.status(401).json({ erro: 'Token inválido.' });
  }

  next();
}

// CRUD protegido por `autenticarToken`:
app.get('/produtos', autenticarToken, (req, res) => {
  return res.json(produtos);
});

app.post('/produtos', autenticarToken, (req, res) => {
  const { nome, preco, categoria, fornecedor, quantidade } = req.body;

  const novoProduto = {
    id: proximoId++,
    nome,
    preco,
    categoria,
    fornecedor,
    quantidade,
  };

  produtos.push(novoProduto);
  return res.status(201).json(novoProduto);
});

app.put('/produtos/:id', autenticarToken, (req, res) => {
  const id = Number(req.params.id);

  // `(item) => item.id === id` é uma função que procura na lista o produto com esse `id`.
  const produto = produtos.find((item) => item.id === id);

  if (!produto) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }

  const { nome, preco, categoria, fornecedor, quantidade } = req.body;

  if (nome !== undefined) produto.nome = nome;
  if (preco !== undefined) produto.preco = preco;
  if (categoria !== undefined) produto.categoria = categoria;
  if (fornecedor !== undefined) produto.fornecedor = fornecedor;
  if (quantidade !== undefined) produto.quantidade = quantidade;

  return res.json(produto);
});

app.delete('/produtos/:id', autenticarToken, (req, res) => {
  const id = Number(req.params.id);
  const tamanhoAntes = produtos.length;

  // `(item) => item.id !== id` é uma função que filtra e mantém só quem não tem esse `id`.
  produtos = produtos.filter((item) => item.id !== id);

  if (produtos.length === tamanhoAntes) {
    return res.status(404).json({ erro: 'Produto não encontrado.' });
  }

  return res.json({ mensagem: 'Produto removido com sucesso.' });
});

// Inicia o servidor na porta 3000.
app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});