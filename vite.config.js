import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // `npm run dev:https` gera um certificado autoassinado para testar a câmera
  // no celular pela rede local. O navegador exibirá um aviso de certificado.
  plugins: mode === 'https' ? [basicSsl()] : [],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
}));
