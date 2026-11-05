const formatadorSaldo = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});

const formatadorHora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
});

export function formatarSaldo(valor) {
  return formatadorSaldo.format(Number(valor) || 0);
}

export function formatarHora(data) {
  return formatadorHora.format(data instanceof Date ? data : new Date(data));
}

const APARENCIA_POR_STATUS = {
  ok: {
    rotulo: 'Em estoque',
    classe: 'badge--success',
    dica: 'Disponível',
  },
  baixo: {
    rotulo: 'Saldo baixo',
    classe: 'badge--warning',
    dica: 'Confira o saldo',
  },
  zerado: {
    rotulo: 'Sem saldo',
    classe: 'badge--danger',
    dica: 'Sem saldo',
  },
};

export function aparenciaDoStatus(status) {
  return APARENCIA_POR_STATUS[status] ?? APARENCIA_POR_STATUS.ok;
}
