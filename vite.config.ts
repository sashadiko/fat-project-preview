import { defineConfig } from 'vite';

// GitHub Pages отдаёт сайт из подпапки (https://<user>.github.io/<repo>/), поэтому пути
// к ассетам в сборке делаем относительными: сайт открывается и из подпапки, и с корня домена.
export default defineConfig({
  base: './',
});
