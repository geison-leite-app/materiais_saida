import { ErroDeValidacao } from './errors.js';

export const LIMITE_SALDO_BAIXO = 10;

/**
 * @typedef {'ok' | 'baixo' | 'zerado'} StatusEstoque
 *
 * @typedef {Object} Material
 * @property {string} id
 * @property {string} codigoInterno
 * @property {string} codigoBarras
 * @property {string} descricao
 * @property {string} unidade
 * @property {number} saldo
 * @property {string} localizacao
 * @property {StatusEstoque} status
 */

/**
 * Cria um material imutável, normalizando os campos e classificando o saldo.
 * @param {Object} dados
 * @param {string} dados.id
 * @param {string} dados.codigoInterno
 * @param {string} [dados.codigoBarras]
 * @param {string} dados.descricao
 * @param {string} dados.unidade
 * @param {number} dados.saldo
 * @param {string} dados.localizacao
 * @returns {Material}
 */
export function criarMaterial(dados) {
  const material = {
    id: exigirTexto(dados.id, 'id'),
    codigoInterno: exigirTexto(dados.codigoInterno, 'codigoInterno').toUpperCase(),
    codigoBarras: normalizarCodigo(dados.codigoBarras),
    descricao: exigirTexto(dados.descricao, 'descricao'),
    unidade: exigirTexto(dados.unidade, 'unidade').toUpperCase(),
    saldo: exigirNumeroNaoNegativo(dados.saldo, 'saldo'),
    localizacao: exigirTexto(dados.localizacao, 'localizacao'),
  };

  return Object.freeze({ ...material, status: classificarSaldo(material.saldo) });
}

/**
 * @param {number} saldo
 * @returns {StatusEstoque}
 */
export function classificarSaldo(saldo) {
  if (saldo <= 0) return 'zerado';
  if (saldo <= LIMITE_SALDO_BAIXO) return 'baixo';
  return 'ok';
}

function exigirTexto(valor, campo) {
  const texto = String(valor ?? '').trim();
  if (!texto) throw new ErroDeValidacao(`O campo "${campo}" é obrigatório.`);
  return texto;
}

function normalizarCodigo(valor) {
  return String(valor ?? '').replace(/\s+/g, '');
}

function exigirNumeroNaoNegativo(valor, campo) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) {
    throw new ErroDeValidacao(`O campo "${campo}" deve ser um número maior ou igual a zero.`);
  }
  return numero;
}
