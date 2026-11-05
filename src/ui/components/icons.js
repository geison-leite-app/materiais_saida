const svg = (conteudo) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${conteudo}</svg>`;

export const iconeCamera = svg(
  '<path d="M3 9.5A2.5 2.5 0 0 1 5.5 7h1.2l1.1-2h8.4l1.1 2h1.2A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-8Z"/><circle cx="12" cy="13.5" r="3.6"/>',
);

export const iconeTeclado = svg(
  '<rect x="2.5" y="6.5" width="19" height="11" rx="2.5"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M6 13.5h.01M9.5 13.5h.01M13 13.5h.01M16.5 13.5h.01M7.5 17h9"/>',
);

export const iconeLanterna = svg('<path d="M13 2 4.5 13.5H10l-1 8.5L19.5 10H13l1-8Z"/>');

export const iconeFechar = svg('<path d="M6 6l12 12M18 6 6 18"/>');

export const iconeAlerta = svg(
  '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5h.01"/>',
);

export const iconeBusca = svg(
  '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/><path d="m9 9 4 4M13 9l-4 4"/>',
);

export const iconePacote = svg(
  '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>',
);

export const iconeSetaEsquerda = svg('<path d="M19 12H5M11 6l-6 6 6 6"/>');
