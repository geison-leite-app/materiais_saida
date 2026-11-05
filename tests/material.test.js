import { describe, expect, it } from 'vitest';
import {
  LIMITE_SALDO_BAIXO,
  classificarSaldo,
  criarMaterial,
} from '../src/core/domain/material.js';

const BASE = {
  id: 'mat_001',
  codigoInterno: 'mat-0001',
  codigoBarras: '7891234567895',
  descricao: 'Cimento CP II 50 kg',
  unidade: 'sc',
  saldo: 120,
  localizacao: 'A1-03',
};

describe('criarMaterial', () => {
  it('normaliza códigos, unidade e classifica o saldo', () => {
    const material = criarMaterial(BASE);

    expect(material.codigoInterno).toBe('MAT-0001');
    expect(material.unidade).toBe('SC');
    expect(material.status).toBe('ok');
  });

  it('congela o objeto para evitar mutação acidental', () => {
    const material = criarMaterial(BASE);

    expect(Object.isFrozen(material)).toBe(true);
    expect(() => {
      material.saldo = 0;
    }).toThrow();
  });

  it('aceita material sem código de barras (cadastro só com código interno)', () => {
    const material = criarMaterial({ ...BASE, codigoBarras: undefined });

    expect(material.codigoBarras).toBe('');
  });

  it('rejeita saldo negativo', () => {
    expect(() => criarMaterial({ ...BASE, saldo: -1 })).toThrow('saldo');
  });

  it('rejeita saldo não numérico', () => {
    expect(() => criarMaterial({ ...BASE, saldo: 'muitos' })).toThrow('saldo');
  });

  it('rejeita descrição vazia', () => {
    expect(() => criarMaterial({ ...BASE, descricao: '   ' })).toThrow('descricao');
  });
});

describe('classificarSaldo', () => {
  it('classifica saldo zerado', () => {
    expect(classificarSaldo(0)).toBe('zerado');
  });

  it('classifica saldo baixo até o limite', () => {
    expect(classificarSaldo(1)).toBe('baixo');
    expect(classificarSaldo(LIMITE_SALDO_BAIXO)).toBe('baixo');
  });

  it('classifica saldo acima do limite como ok', () => {
    expect(classificarSaldo(LIMITE_SALDO_BAIXO + 1)).toBe('ok');
  });
});
