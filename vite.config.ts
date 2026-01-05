
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega as variáveis do arquivo .env (local) ou do painel Vercel (produção)
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Prioriza VITE_GEMINI_API_KEY mas aceita API_KEY como fallback
  const apiKey = env.VITE_GEMINI_API_KEY || env.API_KEY || "";

  return {
    plugins: [react()],
    define: {
      // Substitui globalmente process.env.API_KEY no código do navegador
      'process.env.API_KEY': JSON.stringify(apiKey),
    },
    server: {
      port: 3000
    }
  };
});
