/**
 * Obtém um MediaStream da câmera traseira, com fallback para qualquer câmera.
 * Compartilhado pelos adapters de leitura.
 *
 * @returns {Promise<MediaStream>}
 */
export async function obterStreamDeCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('Câmera não suportada neste navegador.'), {
      name: 'NotSupportedError',
    });
  }

  const base = { audio: false };

  try {
    return await navigator.mediaDevices.getUserMedia({
      ...base,
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
  } catch (erro) {
    const podeTentarSemRestricao =
      erro?.name === 'OverconstrainedError' || erro?.name === 'NotFoundError';

    if (!podeTentarSemRestricao) throw erro;
    return navigator.mediaDevices.getUserMedia({ ...base, video: true });
  }
}
