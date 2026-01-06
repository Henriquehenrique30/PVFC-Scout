import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 3000
    },
    define: {
      // ESSA LINHA É OBRIGATÓRIA PARA FUNCIONAR:
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
    }
  };
});
