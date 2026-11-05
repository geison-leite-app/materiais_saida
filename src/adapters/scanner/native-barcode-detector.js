import { obterStreamDeCamera } from './media-stream.js';
import { rotuloDoFormato } from './rotulo-formato.js';

const FORMATOS = [
  'ean_13',
  'ean_8',
  'upc_a',
  'upc_e',
  'code_128',
  'code_39',
  'code_93',
  'itf',
  'qr_code',
  'data_matrix',
];

const INTERVALO_MESMO_CODIGO_MS = 1500;

/**
 * Verifica suporte real ao BarcodeDetector e aos formatos que usamos.
 * Nunca decide por user-agent.
 */
export async function suportaLeitorNativo() {
  const Detector = globalThis.BarcodeDetector;
  if (typeof Detector !== 'function') return false;
  if (!navigator.mediaDevices?.getUserMedia) return false;

  try {
    const suportados = await Detector.getSupportedFormats();
    return FORMATOS.some((formato) => suportados.includes(formato));
  } catch {
    return false;
  }
}

/**
 * Adapter baseado na BarcodeDetector API (Chrome/Edge Android).
 */
export function createNativeBarcodeScanner() {
  let stream = null;
  let detector = null;
  let rafId = null;
  let ativo = false;
  let ocupado = false;
  let videoEl = null;
  let onDetectRef = null;
  let ultimaLeitura = { valor: '', em: 0 };

  const api = {
    nome: 'barcode-detector',
    lanternaDisponivel: false,

    async iniciar(video, onDetect) {
      const Detector = globalThis.BarcodeDetector;
      const suportados = await Detector.getSupportedFormats();
      const formatos = FORMATOS.filter((formato) => suportados.includes(formato));

      detector = new Detector({ formats: formatos });
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
      rafId = requestAnimationFrame(loop);
    },

    async parar() {
      ativo = false;
      ocupado = false;
      cancelAnimationFrame(rafId);
      rafId = null;

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

  async function loop() {
    if (!ativo) return;

    if (!ocupado && videoEl && videoEl.readyState >= 2) {
      ocupado = true;
      try {
        const resultados = await detector.detect(videoEl);
        const primeiro = resultados[0];

        if (primeiro && deveNotificar(primeiro.rawValue)) {
          onDetectRef?.({
            rawValue: primeiro.rawValue,
            format: rotuloDoFormato(primeiro.format),
            lidoEm: Date.now(),
          });
        }
      } catch {
        // Frame inválido ou câmera ainda inicializando: segue o loop.
      }
      ocupado = false;
    }

    rafId = requestAnimationFrame(loop);
  }

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
