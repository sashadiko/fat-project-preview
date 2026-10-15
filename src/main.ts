import '@fontsource-variable/inter/index.css';
import './styles/main.scss';

import { initCases } from './scripts/cases';
import { initContacts } from './scripts/contacts';
import { initHeroLane, playIntro } from './scripts/hero';
import { initMenu } from './scripts/menu';
import { initSmoothScroll } from './scripts/motion';
import { initReveal } from './scripts/reveal';
import { initShops } from './scripts/shops';
import { initTicker } from './scripts/ticker';

// Основной CSS подключён — снимаем страховочное скрытие страницы (см. <style> в index.html)
document.documentElement.classList.add('css-ready');

initSmoothScroll();
initHeroLane();
initMenu();
initShops();
initContacts();

// Делим текст на строки только после загрузки шрифта, иначе переносы посчитаются по fallback
document.fonts.ready.then(() => {
  playIntro();
  initReveal();
  initTicker();
  initCases();
  document.documentElement.classList.add('reveal-ready');
});
