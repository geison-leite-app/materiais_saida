export class ErroDeValidacao extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'ErroDeValidacao';
  }
}

export class MaterialNaoEncontradoError extends Error {
  constructor(codigo) {
    super(`Nenhum material encontrado para o código ${codigo}.`);
    this.name = 'MaterialNaoEncontradoError';
    this.codigo = codigo;
  }
}

export class ErroDeInfraestrutura extends Error {
  constructor(mensagem, opcoes = {}) {
    super(mensagem, opcoes);
    this.name = 'ErroDeInfraestrutura';
  }
}
