import { criarBarcodeScanner } from '../../adapters/scanner/create-barcode-scanner.js';
import { MaterialNaoEncontradoError } from '../../core/domain/errors.js';
import {
  iconeAlerta,
  iconeBusca,
  iconeCamera,
  iconeFechar,
  iconeLanterna,
  iconePacote,
  iconeSetaEsquerda,
  iconeTeclado,
} from '../components/icons.js';
import { showToast } from '../components/toast.js';
import { aparenciaDoStatus, formatarHora, formatarSaldo } from '../formatters.js';

const ICONES_MENSAGEM = {
  alerta: iconeAlerta,
  busca: iconeBusca,
};

const BARRAS_DECORATIVAS = [
  2, 1, 1, 3, 1, 2, 1, 1, 3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 1, 2, 1, 3, 1, 1, 2, 1, 4, 1, 2, 1, 1, 3, 1,
  2, 1, 1, 3, 1,
];

/**
 * Tela principal: leitura por câmera, busca do material e exibição do saldo.
 *
 * @param {Object} dependencias
 * @param {(codigo: string) => Promise<import('../../core/domain/material.js').Material>} dependencias.buscarMaterialPorCodigo
 * @param {() => Promise<import('../../core/ports/barcode-scanner.js').BarcodeScanner | null>} [dependencias.scannerFactory]
 */
export function createScannerScreen({
  buscarMaterialPorCodigo,
  scannerFactory = criarBarcodeScanner,
}) {
  const element = document.createElement('section');
  element.className = 'screen';
  element.innerHTML = template();

  const refs = {
    views: {
      home: element.querySelector('[data-view="home"]'),
      result: element.querySelector('[data-view="result"]'),
      message: element.querySelector('[data-view="message"]'),
    },
    homeScan: element.querySelector('.view--home [data-action="scan"]'),
    result: {
      badge: element.querySelector('[data-result-badge]'),
      titulo: element.querySelector('[data-result-title]'),
      codigo: element.querySelector('[data-result-codigo]'),
      saldo: element.querySelector('[data-result-saldo]'),
      unidade: element.querySelector('[data-result-unidade]'),
      dica: element.querySelector('[data-result-hint]'),
      localizacao: element.querySelector('[data-result-localizacao]'),
      unidadeMeta: element.querySelector('[data-result-unidade-meta]'),
      barras: element.querySelector('[data-result-barras]'),
      leitura: element.querySelector('[data-result-leitura]'),
    },
    mensagem: {
      icone: element.querySelector('[data-message-icon]'),
      titulo: element.querySelector('[data-message-title]'),
      texto: element.querySelector('[data-message-text]'),
      codigo: element.querySelector('[data-message-code]'),
      detalhe: element.querySelector('[data-message-detail]'),
      acaoPrimaria: element.querySelector('[data-message-action="primary"]'),
      acaoSecundaria: element.querySelector('[data-message-action="secondary"]'),
    },
    camera: element.querySelector('[data-camera]'),
    video: element.querySelector('[data-video]'),
    cameraHint: element.querySelector('[data-camera-hint]'),
    cameraProgress: element.querySelector('[data-camera-progress]'),
    cameraClose: element.querySelector('[data-action="close-camera"]'),
    torch: element.querySelector('[data-action="torch"]'),
    busy: element.querySelector('[data-busy]'),
    dialog: element.querySelector('[data-dialog]'),
    manualForm: element.querySelector('[data-manual-form]'),
    manualInput: element.querySelector('[data-manual-input]'),
    manualError: element.querySelector('[data-manual-error]'),
  };

  let scanner = null;
  let scannerEmCriacao = null;
  let cameraAberta = false;
  let sessaoCamera = 0;
  let buscando = false;
  let lanternaLigada = false;
  let ultimoFoco = null;

  element.addEventListener('click', aoClicar);
  refs.manualForm.addEventListener('submit', aoEnviarManual);
  refs.manualInput.addEventListener('input', () => {
    refs.manualError.hidden = true;
  });
  refs.dialog.addEventListener('click', (evento) => {
    if (evento.target === refs.dialog) refs.dialog.close();
  });

  document.addEventListener('keydown', aoTeclar);
  document.addEventListener('visibilitychange', aoMudarVisibilidade);
  window.addEventListener('pagehide', aoSair);

  function aoClicar(evento) {
    const botao = evento.target.closest('[data-action]');
    if (!botao) return;

    switch (botao.dataset.action) {
      case 'scan':
        abrirCamera();
        break;
      case 'manual':
        abrirManual();
        break;
      case 'reset':
        mostrarHome({ focar: true });
        break;
      case 'close-camera':
        fecharCamera();
        break;
      case 'torch':
        alternarLanterna();
        break;
      case 'manual-from-camera':
        fecharCamera().then(() => abrirManual());
        break;
      case 'cancel-manual':
        refs.dialog.close();
        break;
      default:
        break;
    }
  }

  function aoTeclar(evento) {
    if (!cameraAberta) return;

    if (evento.key === 'Escape') {
      evento.preventDefault();
      fecharCamera();
      return;
    }

    if (evento.key !== 'Tab') return;

    // Mantém o foco preso no overlay da câmera.
    const focaveis = [...refs.camera.querySelectorAll('button:not([hidden]):not([disabled])')];
    if (!focaveis.length) return;

    const primeiro = focaveis[0];
    const ultimo = focaveis[focaveis.length - 1];

    if (!refs.camera.contains(document.activeElement)) {
      evento.preventDefault();
      primeiro.focus();
    } else if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }

  function aoMudarVisibilidade() {
    if (document.hidden && cameraAberta) fecharCamera();
  }

  function aoSair() {
    scanner?.parar()?.catch?.(() => {});
  }

  async function abrirCamera() {
    if (buscando || cameraAberta) return;

    if (!window.isSecureContext) {
      mostrarMensagem({
        icone: 'alerta',
        titulo: 'Câmera bloqueada neste endereço',
        texto:
          'O navegador só libera a câmera em conexões seguras (HTTPS ou localhost). Este endereço é HTTP na rede local.',
        detalhe: `Endereço atual: ${window.location.origin}. Use uma URL https://, o Preview da Vercel ou localhost via USB (chrome://inspect → Port forwarding).`,
        acaoPrincipal: 'manual',
      });
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      mostrarMensagem({
        icone: 'alerta',
        titulo: 'Câmera indisponível',
        texto: 'Este navegador não oferece acesso à câmera para este endereço.',
        detalhe: 'Você ainda pode consultar o material digitando o código.',
        acaoPrincipal: 'manual',
      });
      return;
    }

    const sessao = ++sessaoCamera;
    ultimoFoco = document.activeElement;
    cameraAberta = true;
    lanternaLigada = false;

    refs.camera.hidden = false;
    refs.cameraProgress.hidden = false;
    refs.cameraHint.textContent = 'Solicitando permissão da câmera…';
    refs.torch.hidden = true;
    refs.torch.setAttribute('aria-pressed', 'false');
    document.body.classList.add('is-camera-open');
    refs.cameraClose.focus({ preventScroll: true });

    try {
      scanner = await obterScanner();
      if (!scanner) {
        throw Object.assign(new Error('Leitor de códigos indisponível.'), {
          name: 'NotSupportedError',
        });
      }

      await scanner.iniciar(refs.video, aoDetectar);

      if (sessao !== sessaoCamera) {
        await scanner.parar();
        return;
      }

      refs.cameraHint.textContent = 'Aponte para o código de barras';
      refs.cameraProgress.hidden = true;
      refs.torch.hidden = !scanner.lanternaDisponivel;
    } catch (erro) {
      if (sessao !== sessaoCamera) return;
      await fecharCamera({ restaurarFoco: false });
      tratarErroCamera(erro);
    }
  }

  async function fecharCamera({ restaurarFoco = true } = {}) {
    sessaoCamera += 1;
    const estavaAberta = cameraAberta;
    cameraAberta = false;

    refs.camera.hidden = true;
    refs.cameraProgress.hidden = true;
    refs.torch.hidden = true;
    document.body.classList.remove('is-camera-open');

    if (estavaAberta) {
      try {
        await scanner?.parar();
      } catch {
        // Câmera já liberada pelo sistema.
      }
    }

    if (restaurarFoco && ultimoFoco?.isConnected) {
      ultimoFoco.focus({ preventScroll: true });
    }
    ultimoFoco = null;
  }

  async function obterScanner() {
    if (!scanner && !scannerEmCriacao) {
      scannerEmCriacao = scannerFactory()
        .then((criado) => {
          scanner = criado;
          return criado;
        })
        .catch((erro) => {
          scannerEmCriacao = null;
          throw erro;
        });
    }
    return scannerEmCriacao;
  }

  function aoDetectar(resultado) {
    if (!cameraAberta || buscando) return;

    navigator.vibrate?.(70);

    const leitura = {
      valor: resultado.rawValue,
      formato: resultado.format,
      em: new Date(),
    };

    fecharCamera({ restaurarFoco: false });
    buscarPorCodigo(leitura);
  }

  async function alternarLanterna() {
    if (!scanner?.lanternaDisponivel) return;

    const ligar = !lanternaLigada;
    try {
      await scanner.alternarLanterna(ligar);
      lanternaLigada = ligar;
      refs.torch.setAttribute('aria-pressed', String(ligar));
    } catch {
      refs.torch.hidden = true;
      showToast('Lanterna não disponível neste aparelho.', { tipo: 'erro' });
    }
  }

  function tratarErroCamera(erro) {
    console.warn('Falha ao abrir a câmera:', erro);

    const mensagens = {
      NotAllowedError: {
        titulo: 'Permissão negada',
        texto:
          'Autorize o uso da câmera nas configurações do navegador e tente novamente. Enquanto isso, use o código digitado.',
      },
      NotFoundError: {
        titulo: 'Nenhuma câmera encontrada',
        texto: 'Este aparelho não expõe uma câmera para o navegador.',
      },
      NotReadableError: {
        titulo: 'Câmera ocupada',
        texto: 'Outro aplicativo está usando a câmera. Feche-o e tente novamente.',
      },
      NotSupportedError: {
        titulo: 'Leitor indisponível',
        texto:
          'Este navegador não consegue ler códigos pela câmera. Use o código digitado para continuar.',
      },
      SecurityError: {
        titulo: 'Câmera bloqueada',
        texto: 'O navegador exige uma conexão segura (HTTPS) para liberar a câmera.',
      },
    };

    const mensagem = mensagens[erro?.name] ?? {
      titulo: 'Não foi possível abrir a câmera',
      texto: 'Ocorreu uma falha ao iniciar a câmera. Tente novamente ou digite o código.',
    };

    mostrarMensagem({
      icone: 'alerta',
      tom: 'erro',
      titulo: mensagem.titulo,
      texto: mensagem.texto,
      detalhe: erro?.message && !mensagens[erro?.name] ? erro.message : undefined,
    });
  }

  async function buscarPorCodigo(leitura) {
    if (buscando) return;
    buscando = true;
    refs.busy.hidden = false;

    try {
      const material = await buscarMaterialPorCodigo(leitura.valor);
      renderizarMaterial(material, leitura);
    } catch (erro) {
      if (erro instanceof MaterialNaoEncontradoError) {
        renderizarNaoEncontrado(leitura);
      } else {
        console.error('Falha ao consultar material:', erro);
        renderizarFalha(leitura);
      }
    } finally {
      buscando = false;
      refs.busy.hidden = true;
    }
  }

  function renderizarMaterial(material, leitura) {
    const aparencia = aparenciaDoStatus(material.status);

    refs.result.badge.className = `badge ${aparencia.classe}`;
    refs.result.badge.textContent = aparencia.rotulo;
    refs.result.titulo.textContent = material.descricao;
    refs.result.codigo.textContent = material.codigoInterno;
    refs.result.saldo.textContent = formatarSaldo(material.saldo);
    refs.result.unidade.textContent = material.unidade;
    refs.result.dica.textContent = aparencia.dica;
    refs.result.localizacao.textContent = material.localizacao;
    refs.result.unidadeMeta.textContent = material.unidade;
    refs.result.barras.textContent = material.codigoBarras || '—';
    refs.result.leitura.textContent = `${formatarHora(leitura.em)} · ${leitura.formato}`;

    mostrarView('result');
    refs.result.titulo.focus({ preventScroll: true });
  }

  function renderizarNaoEncontrado(leitura) {
    mostrarMensagem({
      icone: 'busca',
      titulo: 'Material não encontrado',
      texto:
        'Nenhum material cadastrado corresponde a este código. Confira a etiqueta ou busque pelo código interno.',
      codigo: leitura.valor,
      detalhe: `Leitura ${leitura.formato} · ${formatarHora(leitura.em)}`,
    });
  }

  function renderizarFalha(leitura) {
    mostrarMensagem({
      icone: 'alerta',
      tom: 'erro',
      titulo: 'Não foi possível consultar',
      texto: 'Ocorreu uma falha ao buscar o material. Tente novamente em instantes.',
      codigo: leitura.valor,
      detalhe: 'Se o problema persistir, avise o responsável pelo estoque.',
    });
  }

  function mostrarMensagem({
    icone = 'alerta',
    tom = 'aviso',
    titulo,
    texto,
    codigo,
    detalhe,
    acaoPrincipal = 'scan',
  }) {
    refs.mensagem.icone.className = `message-card__icon${
      tom === 'erro' ? ' message-card__icon--erro' : ''
    }`;
    refs.mensagem.icone.innerHTML = ICONES_MENSAGEM[icone] ?? iconeAlerta;
    refs.mensagem.titulo.textContent = titulo;
    refs.mensagem.texto.textContent = texto;

    refs.mensagem.codigo.hidden = !codigo;
    if (codigo) refs.mensagem.codigo.textContent = codigo;

    refs.mensagem.detalhe.hidden = !detalhe;
    if (detalhe) refs.mensagem.detalhe.textContent = detalhe;

    configurarAcoesMensagem(acaoPrincipal);

    mostrarView('message');
    refs.mensagem.titulo.focus({ preventScroll: true });
  }

  function configurarAcoesMensagem(acaoPrincipal) {
    const primaria = refs.mensagem.acaoPrimaria;
    const secundaria = refs.mensagem.acaoSecundaria;

    if (acaoPrincipal === 'manual') {
      primaria.dataset.action = 'manual';
      primaria.innerHTML = `<span class="btn__icon">${iconeTeclado}</span>Digitar código`;
      secundaria.dataset.action = 'reset';
      secundaria.innerHTML = `<span class="btn__icon">${iconeSetaEsquerda}</span>Voltar ao início`;
      return;
    }

    primaria.dataset.action = 'scan';
    primaria.innerHTML = `<span class="btn__icon">${iconeCamera}</span>Escanear outro`;
    secundaria.dataset.action = 'manual';
    secundaria.innerHTML = `<span class="btn__icon">${iconeTeclado}</span>Digitar código`;
  }

  function mostrarHome({ focar = false } = {}) {
    mostrarView('home');
    if (focar) refs.homeScan.focus({ preventScroll: true });
  }

  function mostrarView(nome) {
    for (const [chave, view] of Object.entries(refs.views)) {
      view.hidden = chave !== nome;
    }
    window.scrollTo({ top: 0, left: 0 });
  }

  function abrirManual(preenchimento = '') {
    if (refs.dialog.open) return;

    refs.manualInput.value = preenchimento;
    refs.manualError.hidden = true;
    refs.dialog.showModal();
    refs.manualInput.focus({ preventScroll: true });

    requestAnimationFrame(() => refs.manualInput.select());
  }

  function aoEnviarManual(evento) {
    evento.preventDefault();

    const codigo = refs.manualInput.value.trim();
    if (!codigo) {
      refs.manualError.hidden = false;
      refs.manualInput.focus();
      return;
    }

    refs.dialog.close();
    buscarPorCodigo({ valor: codigo, formato: 'Manual', em: new Date() });
  }

  return {
    element,
    destroy() {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
      window.removeEventListener('pagehide', aoSair);
      refs.dialog.close();
      scanner?.parar()?.catch?.(() => {});
      scanner = null;
      scannerEmCriacao = null;
    },
  };
}

function template() {
  return `
    <section class="view view--home" data-view="home">
      <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true"></span>Estoque → Obra</p>
      <h1 class="hero-title">Leia o <span class="text-accent">código</span><br />de barras</h1>
      <p class="hero-text">
        Identifique o material na hora e confira o saldo antes de liberar para a obra.
      </p>

      <div class="scan-visual" aria-hidden="true">
        <div class="scan-visual__frame">
          <div class="scan-visual__barcode">${svgBarrasDecorativas()}</div>
          <span class="scan-visual__line"></span>
          <span class="scan-corner scan-corner--tl"></span>
          <span class="scan-corner scan-corner--tr"></span>
          <span class="scan-corner scan-corner--bl"></span>
          <span class="scan-corner scan-corner--br"></span>
        </div>
        <p class="scan-visual__caption">EAN-13 · QR Code · Code 128</p>
      </div>

      <div class="hero-actions">
        <button type="button" class="btn btn--primary btn--lg btn--block" data-action="scan">
          <span class="btn__icon">${iconeCamera}</span>
          Escanear código
        </button>
        <button type="button" class="btn btn--soft btn--block" data-action="manual">
          <span class="btn__icon">${iconeTeclado}</span>
          Digitar código
        </button>
      </div>

      <section class="steps" aria-labelledby="steps-title">
        <h2 class="steps__title" id="steps-title">Como funciona</h2>
        <ol class="steps__list">
          <li class="step">
            <span class="step__index">1</span>
            <div>
              <strong>Aponte a câmera</strong>
              <span>A leitura é automática, sem precisar tirar foto.</span>
            </div>
          </li>
          <li class="step">
            <span class="step__index">2</span>
            <div>
              <strong>Confira o material</strong>
              <span>Descrição, localização e saldo disponível na hora.</span>
            </div>
          </li>
          <li class="step">
            <span class="step__index">3</span>
            <div>
              <strong>Repita a leitura</strong>
              <span>Um material por vez, direto do estoque para a obra.</span>
            </div>
          </li>
        </ol>
      </section>
    </section>

    <section class="view view--result" data-view="result" hidden>
      <button type="button" class="back-link" data-action="reset">
        ${iconeSetaEsquerda}
        Nova leitura
      </button>

      <article class="material-card">
        <header class="material-card__top">
          <span class="material-card__icon" aria-hidden="true">${iconePacote}</span>
          <span class="badge badge--neutral" data-result-badge>—</span>
        </header>

        <h2 class="material-card__title" data-result-title tabindex="-1">—</h2>
        <p class="material-card__code">Cód. interno <strong data-result-codigo>—</strong></p>

        <div class="saldo-panel">
          <div>
            <span class="saldo-panel__label">Saldo disponível</span>
            <span class="saldo-panel__value">
              <span data-result-saldo>—</span> <small data-result-unidade>—</small>
            </span>
          </div>
          <span class="saldo-panel__hint" data-result-hint>—</span>
        </div>

        <dl class="meta-grid">
          <div class="meta">
            <dt>Localização</dt>
            <dd data-result-localizacao>—</dd>
          </div>
          <div class="meta">
            <dt>Unidade</dt>
            <dd data-result-unidade-meta>—</dd>
          </div>
          <div class="meta">
            <dt>Código de barras</dt>
            <dd class="mono" data-result-barras>—</dd>
          </div>
          <div class="meta">
            <dt>Leitura</dt>
            <dd data-result-leitura>—</dd>
          </div>
        </dl>
      </article>

      <div class="actions">
        <button type="button" class="btn btn--primary btn--block" data-action="scan">
          <span class="btn__icon">${iconeCamera}</span>
          Escanear outro
        </button>
        <button type="button" class="btn btn--ghost btn--block" data-action="reset">
          Voltar ao início
        </button>
      </div>
    </section>

    <section class="view view--message" data-view="message" hidden>
      <article class="message-card">
        <span class="message-card__icon" data-message-icon aria-hidden="true">${iconeAlerta}</span>
        <h2 class="message-card__title" data-message-title tabindex="-1">—</h2>
        <p class="message-card__text" data-message-text>—</p>
        <code class="code-chip" data-message-code hidden>—</code>
        <p class="message-card__detail" data-message-detail hidden>—</p>

        <div class="actions">
          <button
            type="button"
            class="btn btn--primary btn--block"
            data-message-action="primary"
            data-action="scan"
          >
            <span class="btn__icon">${iconeCamera}</span>
            Escanear outro
          </button>
          <button
            type="button"
            class="btn btn--soft btn--block"
            data-message-action="secondary"
            data-action="manual"
          >
            <span class="btn__icon">${iconeTeclado}</span>
            Digitar código
          </button>
        </div>
      </article>
    </section>

    <div class="busy-layer" data-busy hidden>
      <div class="busy-layer__box" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <p>Consultando material…</p>
      </div>
    </div>

    <div
      class="camera-layer"
      data-camera
      hidden
      role="dialog"
      aria-modal="true"
      aria-label="Leitor de código de barras"
    >
      <video class="camera-video" data-video playsinline muted autoplay></video>
      <div class="camera-scrim" aria-hidden="true"></div>

      <div class="camera-topbar">
        <button
          type="button"
          class="icon-btn icon-btn--glass"
          data-action="close-camera"
          aria-label="Fechar câmera"
        >
          ${iconeFechar}
        </button>
        <p class="camera-topbar__title">Escanear código</p>
        <button
          type="button"
          class="icon-btn icon-btn--glass"
          data-action="torch"
          aria-label="Lanterna"
          aria-pressed="false"
          hidden
        >
          ${iconeLanterna}
        </button>
      </div>

      <div class="camera-frame" aria-hidden="true">
        <span class="scan-corner scan-corner--tl"></span>
        <span class="scan-corner scan-corner--tr"></span>
        <span class="scan-corner scan-corner--bl"></span>
        <span class="scan-corner scan-corner--br"></span>
        <span class="camera-frame__line"></span>
      </div>

      <div class="camera-bottom">
        <p class="camera-hint" data-camera-hint role="status" aria-live="polite">
          Aponte para o código de barras
        </p>
        <div class="camera-progress" data-camera-progress hidden>
          <span class="spinner spinner--light" aria-hidden="true"></span>
        </div>
        <button type="button" class="btn btn--glass btn--block" data-action="manual-from-camera">
          <span class="btn__icon">${iconeTeclado}</span>
          Digitar código
        </button>
      </div>
    </div>

    <dialog class="dialog" data-dialog aria-labelledby="manual-title">
      <form class="dialog__form" data-manual-form novalidate>
        <div class="dialog__head">
          <h2 id="manual-title">Digitar código</h2>
          <button
            type="button"
            class="icon-btn"
            data-action="cancel-manual"
            aria-label="Fechar"
          >
            ${iconeFechar}
          </button>
        </div>

        <p class="dialog__text">
          Informe o código de barras (EAN-13) ou o código interno, como
          <span class="mono">MAT-0001</span>.
        </p>

        <label class="field">
          <span class="field__label">Código do material</span>
          <input
            class="field__input"
            data-manual-input
            name="codigo"
            type="text"
            inputmode="text"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="7891234567895"
            required
          />
        </label>
        <p class="field__error" data-manual-error hidden>Informe um código.</p>

        <div class="dialog__actions">
          <button type="button" class="btn btn--ghost" data-action="cancel-manual">Cancelar</button>
          <button type="submit" class="btn btn--primary">Buscar material</button>
        </div>
      </form>
    </dialog>
  `;
}

function svgBarrasDecorativas() {
  let x = 4;
  const barras = [];

  BARRAS_DECORATIVAS.forEach((largura, indice) => {
    if (indice % 2 === 0) {
      barras.push(`<rect x="${x}" y="0" width="${largura}" height="56" rx="1" />`);
    }
    x += largura + 2;
  });

  return `<svg viewBox="0 0 ${x + 4} 56" preserveAspectRatio="xMidYMid meet" fill="currentColor">${barras.join('')}</svg>`;
}
