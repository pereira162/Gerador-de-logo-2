
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
// Fix: Import fileURLToPath to resolve __dirname in ES modules
import { fileURLToPath } from 'url';

export default defineConfig(({ mode }) => {
    // Carrega variáveis de ambiente do diretório atual (onde o build é executado)
    // O terceiro argumento '' significa carregar todas as variáveis, sem prefixo específico.
    // Fix: Replaced process.cwd() with path.resolve() to avoid TypeScript type errors
    // regarding 'process.cwd'. path.resolve() (with no arguments) provides the current working directory.
    const env = loadEnv(mode, path.resolve(), '');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    let base = '/';
    // Verifica se está rodando no GitHub Actions para um build de produção
    // e se GITHUB_REPOSITORY está definido (ex: 'seu-usuario/seu-repositorio')
    if (mode === 'production' && env.GITHUB_ACTIONS === 'true' && env.GITHUB_REPOSITORY) {
      const repoName = env.GITHUB_REPOSITORY.split('/')[1];
      if (repoName) {
        base = `/${repoName}/`;
      }
    }

    return {
      base: base, // Define o caminho base para o deploy
      define: {
        // Isso torna GEMINI_API_KEY (do ambiente de build do Actions)
        // disponível como process.env.API_KEY no código do seu cliente.
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) // Redundante se o SDK usa apenas process.env.API_KEY
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});