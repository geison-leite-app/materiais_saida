import { criarMaterial } from '../../core/domain/material.js';
import { MATERIAIS_FIXTURE } from '../../data/materiais.fixture.js';

/**
 * Adapter de catálogo em memória. Simula a latência da futura API.
 *
 * @param {{ materiais?: Object[], latenciaMs?: number }} [opcoes]
 */
export function criarFixtureMaterialRepository({
  materiais = MATERIAIS_FIXTURE,
  latenciaMs = 350,
} = {}) {
  const catalogo = materiais.map(criarMaterial);
  const indice = new Map();

  for (const material of catalogo) {
    for (const chave of [material.codigoBarras, material.codigoInterno]) {
      if (!chave) continue;
      indice.set(chave, material);
      indice.set(chave.toUpperCase(), material);
    }
  }

  return {
    async buscarPorCodigo(codigo) {
      if (latenciaMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, latenciaMs));
      }

      const chave = String(codigo ?? '').trim();
      return indice.get(chave) ?? indice.get(chave.toUpperCase()) ?? null;
    },

    listar() {
      return [...catalogo];
    },
  };
}
