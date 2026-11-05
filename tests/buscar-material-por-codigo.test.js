import { describe, expect, it } from 'vitest';
import { criarFixtureMaterialRepository } from '../src/adapters/repositories/fixture-material-repository.js';
import { ErroDeValidacao, MaterialNaoEncontradoError } from '../src/core/domain/errors.js';
import { criarBuscarMaterialPorCodigo } from '../src/core/usecases/buscar-material-por-codigo.js';

function criarCasoDeUso() {
  const materialRepository = criarFixtureMaterialRepository({ latenciaMs: 0 });
  return criarBuscarMaterialPorCodigo({ materialRepository });
}

describe('buscarMaterialPorCodigo', () => {
  it('encontra material pelo código de barras (EAN-13)', async () => {
    const buscar = criarCasoDeUso();

    const material = await buscar('7891234567895');

    expect(material.codigoInterno).toBe('MAT-0001');
    expect(material.descricao).toContain('Cimento');
  });

  it('encontra material pelo código interno, ignorando caixa', async () => {
    const buscar = criarCasoDeUso();

    const material = await buscar('mat-0004');

    expect(material.descricao).toContain('Vergalhão');
  });

  it('remove espaços acidentais da leitura', async () => {
    const buscar = criarCasoDeUso();

    const material = await buscar('  7890000000055  ');

    expect(material.codigoInterno).toBe('MAT-0006');
  });

  it('sinaliza material não encontrado', async () => {
    const buscar = criarCasoDeUso();

    await expect(buscar('0000000000000')).rejects.toBeInstanceOf(MaterialNaoEncontradoError);
  });

  it('sinaliza código vazio como erro de validação', async () => {
    const buscar = criarCasoDeUso();

    await expect(buscar('   ')).rejects.toBeInstanceOf(ErroDeValidacao);
  });

  it('exige o repositório na criação do caso de uso', () => {
    expect(() => criarBuscarMaterialPorCodigo({})).toThrow('materialRepository');
  });
});
