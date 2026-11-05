import { describe, expect, it } from 'vitest';
import { MATERIAIS_FIXTURE } from '../src/data/materiais.fixture.js';

function digitoVerificadorEan13(codigo) {
  const soma = codigo
    .slice(0, 12)
    .split('')
    .map(Number)
    .reduce((total, digito, indice) => total + digito * (indice % 2 === 0 ? 1 : 3), 0);

  return (10 - (soma % 10)) % 10;
}

describe('catálogo de demonstração', () => {
  it('usa códigos de barras EAN-13 válidos', () => {
    for (const material of MATERIAIS_FIXTURE) {
      const codigo = material.codigoBarras;

      expect(codigo, material.codigoInterno).toHaveLength(13);
      expect(Number(codigo[12]), material.codigoInterno).toBe(digitoVerificadorEan13(codigo));
    }
  });

  it('mantém códigos internos únicos e normalizados', () => {
    const codigos = MATERIAIS_FIXTURE.map((material) => material.codigoInterno);
    const unicos = new Set(codigos);

    expect(unicos.size).toBe(codigos.length);
    for (const codigo of codigos) {
      expect(codigo).toMatch(/^MAT-\d{4}$/);
    }
  });

  it('tem pelo menos um material em cada situação de estoque', () => {
    const saldos = MATERIAIS_FIXTURE.map((material) => material.saldo);

    expect(saldos.some((saldo) => saldo === 0)).toBe(true);
    expect(saldos.some((saldo) => saldo > 0 && saldo <= 10)).toBe(true);
    expect(saldos.some((saldo) => saldo > 10)).toBe(true);
  });
});
