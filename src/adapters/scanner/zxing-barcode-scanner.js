import { obterStreamDeCamera } from './media-stream.js';
import { rotuloDoFormato } from './rotulo-formato.js';

const INTERVALO_MESMO_CODIGO_MS = 1500;

/**
 * Adapter de fallback com ZXing. Carregado sob demanda (import dinâmico),
 * então não pesa no bundle de aparelhos com BarcodeDetector nativo.
 */
export function createZxingBarcodeScanner() {
  let reader = null;
  let controls = null;
  let stream = null;
  let videoEl = null;
  let ativo = false;
  let ultimaLeitura = { valor: '', em: 0 };
  let onDetectRef = null;

  const api = {
    nome: 'zxing',
    lanternaDisponivel: false,

    async iniciar(video, onDetect) {
      const [{ BrowserMultiFormatReader }, { BarcodeFormat }] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ]);

      reader = new BrowserMultiFormatReader();
      stream = await obterStreamDeCamera();

      videoEl = video;
      onDetectRef = onDetect;
      video.srcObject = stream;
      video.muted = true;
      video.setAttribute('playsinline', '');
      await video.play();

      const track = stream.getVideoTracks()[0];
      api.lanternaDisponivel = Boolean(track?.getCapabilities?.().torch);

      ativo = true;
      controls = reader.decodeFromStream(stream, video, (resultado, erro) => {
        if (!ativo || erro || !resultado) return;

        const valor = resultado.getText();
        if (!deveNotificar(valor)) return;

        const formato = BarcodeFormat[resultado.getBarcodeFormat()] ?? '';
        onDetectRef?.({
          rawValue: valor,
          format: rotuloDoFormato(formato),
          lidoEm: Date.now(),
        });
      });
    },

    async parar() {
      ativo = false;
      controls?.stop();
      controls = null;

      stream?.getTracks().forEach((track) => track.stop());
      stream = null;

      if (videoEl) {
        videoEl.srcObject = null;
        videoEl = null;
      }

      api.lanternaDisponivel = false;
    },

    async alternarLanterna(ligada) {
      const track = stream?.getVideoTracks()[0];
      if (!track) return;
      await track.applyConstraints({ advanced: [{ torch: Boolean(ligada) }] });
    },
  };

  function deveNotificar(valor) {
    const agora = Date.now();
    if (valor === ultimaLeitura.valor && agora - ultimaLeitura.em < INTERVALO_MESMO_CODIGO_MS) {
      return false;
    }
    ultimaLeitura = { valor, em: agora };
    return true;
  }

  return api;
}
