import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno estrictamente
  const env = loadEnv(mode, process.cwd(), '');
  
  if (!env.VITE_BASE_URL) {
    throw new Error(
      "ERROR FATAL: La variable de entorno 'VITE_BASE_URL' no está definida en el archivo .env del frontend. " +
      "Por favor, configure VITE_BASE_URL (ej: VITE_BASE_URL=http://localhost:8000/api)"
    );
  }

  let backendTarget;
  try {
    const url = new URL(env.VITE_BASE_URL);
    backendTarget = url.origin;
  } catch (e) {
    throw new Error(
      `ERROR FATAL: La URL configurada en VITE_BASE_URL (${env.VITE_BASE_URL}) no es válida. ` +
      `Detalle: ${e.message}`
    );
  }

  // Permite configurar el puerto de desarrollo del frontend por .env
  const devPort = env.VITE_PORT ? parseInt(env.VITE_PORT) : 3000;

  return {
    plugins: [react(), tailwindcss()],
    preview: { port: 443, host: true },
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
        }
      }
    },
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@context': path.resolve(__dirname, './src/context'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@services': path.resolve(__dirname, './src/services'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@helpers': path.resolve(__dirname, './src/helpers')
      }
    }
  };
});
