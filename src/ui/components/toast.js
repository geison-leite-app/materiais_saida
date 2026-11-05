let pilha = null;

export function showToast(mensagem, { tipo = 'info', duracao = 4200 } = {}) {
  pilha ??= criarPilha();

  const toast = document.createElement('div');
  toast.className = `toast toast--${tipo}`;
  toast.setAttribute('role', 'status');
  toast.textContent = mensagem;
  pilha.append(toast);

  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 260);
  }, duracao);
}

function criarPilha() {
  const elemento = document.createElement('div');
  elemento.className = 'toast-stack';
  document.body.append(elemento);
  return elemento;
}
