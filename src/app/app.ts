import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

export class Produto {
  id: number;
  nome: string;
  preco: number;
  categoria: string;
  fornecedor: string;
  quantidade: number;

  constructor(id: number, nome: string, preco: number, categoria: string, fornecedor: string, quantidade: number) {
    this.id = id;
    this.nome = nome;
    this.preco = preco;
    this.categoria = categoria;
    this.fornecedor = fornecedor;
    this.quantidade = quantidade;
  }

  get Id(): number {
    return this.id;
  }
  set Id(value: number) {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('O ID do produto deve ser um número válido.');
    } else if (value < 0) {
      throw new Error('O ID do produto não pode ser negativo.');
    } else {
      this.id = value;
    }
  }

  get Nome(): string {
    return this.nome;
  }
  set Nome(value: string) {
    if (value.trim() === '') {
      throw new Error('O nome do produto não pode ser vazio.');
    } else if (typeof value !== 'string' || !isNaN(Number(value))) {
      throw new Error('O nome do produto não pode ser um número.');
    } else if (value.length < 2) {
      throw new Error('O nome do produto deve ter pelo menos 2 caracteres.');
    } else if (value.length > 50) {
      throw new Error('O nome do produto não pode ter mais de 50 caracteres.');
    } else {
      this.nome = value;
    }
  }

  get Preco(): number {
    return this.preco;
  }
  set Preco(value: number) {
    if (value < 0) {
      throw new Error('O preço do produto não pode ser negativo.');
    } else if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('O preço do produto deve ser um número válido.');
    }
    this.preco = value;
  }

  get Categoria(): string {
    return this.categoria;
  }
  set Categoria(value: string) {
    if (value.trim() === '') {
      throw new Error('A categoria do produto não pode ser vazia.');
    } else if (typeof value === 'number' || !isNaN(Number(value))) {
      throw new Error('A categoria do produto não pode ser um número.');
    } else {
      this.categoria = value;
    }
  }

  get Fornecedor(): string {
    return this.fornecedor;
  }
  set Fornecedor(value: string) {
    if (value.trim() === '') {
      throw new Error('O fornecedor do produto não pode ser vazio.');
    } else if (typeof value === 'number' || !isNaN(Number(value))) {
      throw new Error('O fornecedor do produto não pode ser um número.');
    } else {
      this.fornecedor = value;
    }
  }

  get Quantidade(): number {
    return this.quantidade;
  }
  set Quantidade(value: number) {
    if (value < 0) {
      throw new Error('A quantidade não pode ser negativa.');
    } else if (typeof value !== 'number' || isNaN(value)) {
      throw new Error('A quantidade deve ser um número válido.');
    } else {
      this.quantidade = value;
    }
  }

  faturamento(): number {
    return this.preco * this.quantidade;
  }
}

@Component({
  imports: [FormsModule],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('gestao-estoque');
  private apiUrl = 'http://localhost:3000';

  usuario = '';
  senha = '';
  token = signal('');
  produtos = signal<Produto[]>([]);
  mensagemErro = signal('');

  idEditando: number | null = null;
  nome = '';
  preco = 0;
  categoria = '';
  fornecedor = '';
  quantidade = 0;

  async fazerLogin() {
    this.mensagemErro.set('');

    try {
      const resposta = await fetch(`${this.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: this.usuario, senha: this.senha }),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        this.mensagemErro.set(dados.erro || 'Usuário ou senha inválidos.');
        return;
      }

      this.token.set(dados.token);
      await this.carregarProdutos();
    } catch {
      this.mensagemErro.set('Erro ao conectar no servidor. Verifique se o backend (porta 3000) está rodando.');
    }
  }

  sair() {
    this.token.set('');
    this.produtos.set([]);
    this.mensagemErro.set('');
  }

  async carregarProdutos() {
    this.mensagemErro.set('');

    try {
      const resposta = await fetch(`${this.apiUrl}/produtos`, {
        headers: { Authorization: `Bearer ${this.token()}` },
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        this.mensagemErro.set(`${resposta.status} - ${dados.erro}`);
        return;
      }

      this.produtos.set(
        dados.map(
          (item: any) => new Produto(item.id, item.nome, item.preco, item.categoria, item.fornecedor, item.quantidade)
        )
      );
    } catch {
      this.mensagemErro.set('Erro ao conectar no servidor. Verifique se o backend (porta 3000) está rodando.');
    }
  }

  async salvarProduto() {
    this.mensagemErro.set('');

    try {
      const produtoValidado = new Produto(0, 'temp', 0, 'temp', 'temp', 0);
      produtoValidado.Nome = this.nome;
      produtoValidado.Preco = Number(this.preco);
      produtoValidado.Categoria = this.categoria;
      produtoValidado.Fornecedor = this.fornecedor;
      produtoValidado.Quantidade = Number(this.quantidade);

      const corpo = {
        nome: produtoValidado.Nome,
        preco: produtoValidado.Preco,
        categoria: produtoValidado.Categoria,
        fornecedor: produtoValidado.Fornecedor,
        quantidade: produtoValidado.Quantidade,
      };

      const url = this.idEditando !== null
        ? `${this.apiUrl}/produtos/${this.idEditando}`
        : `${this.apiUrl}/produtos`;

      const metodo = this.idEditando !== null ? 'PUT' : 'POST';

      const resposta = await fetch(url, {
        method: metodo,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token()}`,
        },
        body: JSON.stringify(corpo),
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        this.mensagemErro.set(`${resposta.status} - ${dados.erro}`);
        return;
      }

      this.limparFormulario();
      await this.carregarProdutos();
    } catch (erro: any) {
      this.mensagemErro.set(erro.message || 'Erro ao salvar produto.');
    }
  }

  editarProduto(produto: Produto) {
    this.idEditando = produto.Id;
    this.nome = produto.Nome;
    this.preco = produto.Preco;
    this.categoria = produto.Categoria;
    this.fornecedor = produto.Fornecedor;
    this.quantidade = produto.Quantidade;
  }

  async excluirProduto(id: number) {
    this.mensagemErro.set('');

    try {
      const resposta = await fetch(`${this.apiUrl}/produtos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${this.token()}` },
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        this.mensagemErro.set(`${resposta.status} - ${dados.erro}`);
        return;
      }

      await this.carregarProdutos();
    } catch {
      this.mensagemErro.set('Erro ao excluir produto.');
    }
  }

  limparFormulario() {
    this.idEditando = null;
    this.nome = '';
    this.preco = 0;
    this.categoria = '';
    this.fornecedor = '';
    this.quantidade = 0;
  }
}