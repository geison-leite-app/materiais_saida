import { ErroDeValidacao, MaterialNaoEncontradoError } from '../domain/errors.js';

/**
 * Caso de uso: localizar um material pelo código lido (barras ou interno).
 * Depende apenas do contrato MaterialRepository (Dependency Inversion).
 *
 * @param {{ materialRepository: import('../ports/material-repository.js').MaterialRepository }} dependencias
 */
export function criarBuscarMaterialPorCodigo({ materialRepository }) {
  if (!materialRepository) {
    throw new Error('materialRepository é obrigatório.');
  }

  return async function buscarMaterialPorCodigo(codigo) {
    const normalizado = normalizarEntrada(codigo);
    if (!normalizado) {
      throw new ErroDeValidacao('Informe um código válido.');
    }

    const material = await materialRepository.buscarPorCodigo(normalizado);
    if (!material) {
      throw new MaterialNaoEncontradoError(normalizado);
    }

    return material;
  };
}

function normalizarEntrada(codigo) {
  return String(codigo ?? '')
    .trim()
    .replace(/\s+/g, '');
}
