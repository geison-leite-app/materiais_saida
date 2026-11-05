/**
 * Contrato de repositório de materiais.
 * Qualquer adapter (fixture, HTTP, IndexedDB) deve cumprir esta interface.
 *
 * @typedef {Object} MaterialRepository
 * @property {(codigo: string) => Promise<import('../domain/material.js').Material | null>} buscarPorCodigo
 */

export {};
