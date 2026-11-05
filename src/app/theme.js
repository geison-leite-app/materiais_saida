const CHAVE_TEMA = 'mso:theme';
const CORES_TEMA = { light: '#0C76BC', dark: '#080F17' };

/**
 * Aplica o tema salvo (ou o do sistema) e liga o botão de alternância.
 */
export function initTheme() {
  const raiz = document.documentElement;
  const botao = document.querySelector('[data-theme-toggle]');
  const metaTema = document.querySelector('meta[name="theme-color"]');

  const aplicar = (tema, persistir) => {
    raiz.dataset.theme = tema;
    metaTema?.setAttribute('content', CORES_TEMA[tema]);
    botao?.setAttribute('aria-pressed', String(tema === 'dark'));
    botao?.setAttribute('aria-label', tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro');

    if (persistir) {
      try {
        localStorage.setItem(CHAVE_TEMA, tema);
      } catch {
        // Armazenamento indisponível (modo privado): segue sem persistir.
      }
    }
  };

  aplicar(lerTemaAtual(raiz), false);

  botao?.addEventListener('click', () => {
    aplicar(raiz.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener?.('change', (evento) => {
    if (!temaFoiEscolhidoPeloUsuario()) {
      aplicar(evento.matches ? 'dark' : 'light', false);
    }
  });
}

function lerTemaAtual(raiz) {
  return raiz.dataset.theme === 'dark' ? 'dark' : 'light';
}

function temaFoiEscolhidoPeloUsuario() {
  try {
    return Boolean(localStorage.getItem(CHAVE_TEMA));
  } catch {
    return false;
  }
}
