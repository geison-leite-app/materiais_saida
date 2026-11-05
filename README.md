# Materiais · Saída de obra

Aplicativo web/móvel para identificar materiais do estoque pela câmera do celular e conferir o saldo antes de liberar para a obra.

**Status atual:** Fases 0–2 concluídas — fundação do projeto, design system e leitura de códigos com dados de demonstração.

---

## Stack

- **Vite 7** + **JavaScript puro** (ES Modules), sem framework
- **CSS** com design tokens, tema claro/escuro e layout mobile-first
- **BarcodeDetector API** como leitor principal e **ZXing** como fallback
- **Vitest** para testes de domínio
- **Vercel Functions** (`api/`) para o BFF — previsto para a Fase 3

## Como rodar

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`.

### Testar a câmera no celular

O Chrome só entrega `navigator.mediaDevices` em **contextos seguros**: `https://` ou `localhost`. Por isso `http://192.168.x.x:5173` abre o app, mas a câmera não funciona — o app agora explica isso na tela e oferece o modo manual.

**Opção 1 — USB + port forwarding (mais confiável)**

1. Ative a depuração USB no Android e conecte o cabo.
2. No desktop, abra `chrome://inspect` → **Port forwarding**.
3. Adicione a regra: porta do dispositivo `5173` → `localhost:5173`.
4. No celular, abra `http://localhost:5173`.

`localhost` é considerado contexto seguro, então a câmera é liberada.

**Opção 2 — Preview da Vercel**

1. Faça o deploy de uma branch.
2. Abra a URL `https://...vercel.app` no Chrome do Android.

**Opção 3 — HTTPS local com certificado autoassinado**

```bash
npm run dev:https
```

Acesse `https://192.168.x.x:5173` no celular e aceite o aviso de certificado. Se o Chrome continuar bloqueando a câmera, use a Opção 1.

**Alternativa apenas para teste:** no celular, abra `chrome://flags/#unsafely-treat-insecure-origin-as-secure`, adicione `http://192.168.x.x:5173` e reinicie o Chrome. Não use isso em produção.

No desktop, o Chrome permite simular uma câmera:

```bash
chrome --use-fake-ui-for-media-stream --use-fake-device-for-media-stream
```

## Scripts

| Script               | O que faz                                                         |
| -------------------- | ----------------------------------------------------------------- |
| `npm run dev`        | Servidor Vite com HMR                                             |
| `npm run dev:https`  | Servidor Vite com HTTPS autoassinado (teste da câmera no celular) |
| `npm run dev:vercel` | Site + funções `/api` juntos (`vercel dev`)                       |
| `npm run build`      | Build de produção em `dist/`                                      |
| `npm run preview`    | Serve o build localmente                                          |
| `npm test`           | Testes unitários (Vitest)                                         |
| `npm run test:watch` | Testes em modo watch                                              |
| `npm run lint`       | ESLint                                                            |
| `npm run format`     | Prettier                                                          |

## Dados de demonstração

Enquanto o ERP não está conectado, o adapter `fixture-material-repository.js` serve 10 materiais. Os códigos de barras são **EAN-13 válidos**, então funcionam com etiquetas geradas por qualquer gerador de código de barras.

| Código de barras | Código interno | Material                | Saldo    |
| ---------------- | -------------- | ----------------------- | -------- |
| `7891234567895`  | MAT-0001       | Cimento CP II 50 kg     | 120 SC   |
| `7890000000017`  | MAT-0002       | Areia média lavada      | 18 M3    |
| `7890000000024`  | MAT-0003       | Brita 1                 | 9 M3     |
| `7890000000031`  | MAT-0004       | Vergalhão CA-50 10 mm   | 240 BR   |
| `7890000000048`  | MAT-0005       | Tijolo cerâmico         | 1.500 UN |
| `7890000000055`  | MAT-0006       | Argamassa AC-III 20 kg  | 64 SC    |
| `7890000000062`  | MAT-0007       | Tinta acrílica 18 L     | 22 LT    |
| `7890000000079`  | MAT-0008       | Tubo PVC 100 mm         | 37 BR    |
| `7890000000086`  | MAT-0009       | Fio flexível 2,5 mm     | 0 RL     |
| `7890000000093`  | MAT-0010       | Epóxi bicomponente 1 kg | 5 KT     |

Também é possível digitar o código interno (ex.: `MAT-0001`) no botão **Digitar código**, além de QR Codes cujo conteúdo seja um desses códigos.

## Estrutura

```
src/
├─ core/                    # regras puras: não conhecem DOM, câmera ou HTTP
│  ├─ domain/               # entidades e erros
│  ├─ usecases/             # BuscarMaterialPorCodigo
│  └─ ports/                # contratos (BarcodeScanner, MaterialRepository)
├─ adapters/                # implementações trocáveis
│  ├─ scanner/              # BarcodeDetector, ZXing, seleção com fallback
│  └─ repositories/         # fixture (mock); HTTP entra na Fase 3
├─ ui/
│  ├─ components/           # ícones, toast
│  ├─ screens/              # scanner-screen (máquina de estados)
│  ├─ styles/               # tokens, base, components, scanner
│  └─ formatters.js
├─ app/theme.js             # tema claro/escuro persistido
├─ data/                    # catálogo de demonstração
└─ main.js                  # composition root
```

### Princípios aplicados

- **S** — o adapter só lê a câmera; o caso de uso só aplica regra; a tela só apresenta.
- **O** — um novo leitor entra como novo adapter, sem alterar o caso de uso.
- **L** — todos os leitores cumprem o mesmo contrato (`iniciar`, `parar`, `alternarLanterna`).
- **I** — ports pequenos e específicos.
- **D** — `main.js` injeta as implementações; o domínio depende apenas dos contratos.

## Segurança

- **Nenhum segredo no frontend.** A futura `ERP_API_KEY` ficará nas Environment Variables da Vercel e será usada apenas pelas funções em `api/`.
- O BFF terá rotas explícitas (sem proxy curinga), timeout de 8 s e `Idempotency-Key` no registro de saída.
- A liberação de produção com escrita no estoque depende de uma decisão de controle de acesso (login do colaborador ou proteção da Vercel).

## Próximas fases

3. Contrato no Postman + `api/materiais` + `HttpMaterialRepository` + cache.
4. Registro de saída com `POST` idempotente e fila offline.
5. Histórico, navegação e login/sessão.
6. PWA, acessibilidade, testes e2e e go-live.
