import { defineConfig } from 'vite';

// En GitHub Actions toma el nombre REAL del repositorio para servir sus assets.
// En localhost se usan rutas relativas; no hay que editar este archivo.
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
export default defineConfig({
  base: process.env.GITHUB_ACTIONS && repository ? `/${repository}/` : './',
  server: { host: '0.0.0.0' },
});
