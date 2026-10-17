import { CASES, type CaseData, type CaseImage } from './case-data';
import { gsap, lenis, prefersReducedMotion } from './motion';

// Попап кейса по кнопке «Изучить проект». Нативный <dialog>: фокус внутри, Esc закрывает,
// страница под ним недоступна. Попап сам прокручивается (страница за ним стоит), кнопка exit
// закреплена у верхнего края окна (position: sticky в стилях). Закрыть можно кнопкой exit,
// клавишей Esc или кликом по затемнённому фону вокруг панели.

// Пути от base из vite.config: на GitHub Pages сайт живёт в подпапке
const IMG_DIR = `${import.meta.env.BASE_URL}img/popup/`;
const WIDTHS = [800, 1400, 2000];

// Доля ширины окна, которую фото занимает в ряду (для sizes): на mobile ряды из 2–3 фото — сетка в 2 колонки
const sizes = (count: number) => {
  if (count === 1) return '100vw';
  const desktop = Math.round(90 / count);
  return `(min-width: 1200px) ${desktop}vw, (min-width: 768px) ${Math.round(100 / count)}vw, ${count === 3 ? '100vw' : '50vw'}`;
};

// Файл шире исходника не делали: такой вариант содержит фото в исходном размере
const srcset = ({ src, w }: CaseImage) =>
  [...new Map(WIDTHS.map((width) => [Math.min(width, w), width])).entries()]
    .map(([real, width]) => `${IMG_DIR}${src}-${width}.webp ${real}w`)
    .join(', ');

const picture = (image: CaseImage, count: number, className: string) =>
  `<img class="${className}" src="${IMG_DIR}${image.src}-800.webp" srcset="${srcset(image)}" sizes="${sizes(count)}" width="${image.w}" height="${image.h}" alt="${image.alt}" loading="lazy" decoding="async" />`;

// Предзагрузка: пока курсор над кнопкой (или палец коснулся её), браузер начинает качать
// обложку и первый ряд фото — к моменту открытия попапа они уже в кэше
const warmed = new Set<string>();
const warm = (key: string) => {
  const data = CASES[key];
  if (!data || warmed.has(key)) return;
  warmed.add(key);
  const firstRow = data.blocks.find((block) => block.kind === 'images');
  const targets: [CaseImage, number][] = [[data.cover, 1]];
  if (firstRow?.kind === 'images') firstRow.images.forEach((image) => targets.push([image, firstRow.images.length]));
  targets.forEach(([image, count]) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.type = 'image/webp';
    link.setAttribute('imagesrcset', srcset(image));
    link.setAttribute('imagesizes', sizes(count));
    document.head.append(link);
  });
};

const render = (data: CaseData) => `
  <header class="popup__heading">
    <p class="popup__type">${data.type}</p>
    <h2 class="popup__name" id="popup-title">${data.name}</h2>
    <p class="popup__location">${data.location}</p>
  </header>
  <div class="popup__cover">${picture(data.cover, 1, 'popup__img')}</div>
  ${data.blocks
    .map((block) =>
      block.kind === 'text'
        ? `<div class="popup__text">${block.sections
            .map((section) => `<section class="popup__section"><h3>${section.title}</h3><p>${section.text}</p></section>`)
            .join('')}</div>`
        : `<div class="popup__row" data-count="${block.images.length}">${block.images
            .map((image) => picture(image, block.images.length, 'popup__img'))
            .join('')}</div>`,
    )
    .join('')}
`;

export function initCasePopup() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-popup]');
  const panel = dialog?.querySelector<HTMLElement>('[data-popup-panel]');
  const content = dialog?.querySelector<HTMLElement>('[data-popup-content]');
  if (!dialog || !panel || !content || typeof dialog.showModal !== 'function') return;

  let opener: HTMLElement | null = null;
  let closing = false;

  const open = (key: string, trigger: HTMLElement) => {
    const data = CASES[key];
    if (!data || dialog.open) return;
    opener = trigger;
    content.innerHTML = render(data);
    // Первое фото видно сразу — грузим его без очереди
    content.querySelector<HTMLImageElement>('.popup__cover img')?.setAttribute('loading', 'eager');

    lenis?.stop();
    document.documentElement.classList.add('popup-open');
    dialog.showModal();
    dialog.scrollTop = 0;
    dialog.querySelector<HTMLElement>('[data-popup-close]')?.focus({ preventScroll: true });

    const reduce = prefersReducedMotion();
    gsap.killTweensOf([dialog, panel]);
    gsap.fromTo(dialog, { opacity: 0 }, { opacity: 1, duration: reduce ? 0.01 : 0.45, ease: 'power2.out' });
    if (!reduce) gsap.fromTo(panel, { y: 80 }, { y: 0, duration: 0.9, ease: 'expo.out', clearProps: 'transform' });
  };

  const finish = () => {
    closing = false;
    dialog.close();
    content.innerHTML = '';
    document.documentElement.classList.remove('popup-open');
    lenis?.start();
    opener?.focus({ preventScroll: true });
  };

  const close = () => {
    if (!dialog.open || closing) return;
    closing = true;
    const reduce = prefersReducedMotion();
    gsap.killTweensOf([dialog, panel]);
    if (!reduce) gsap.to(panel, { y: 40, duration: 0.4, ease: 'power2.in' });
    gsap.to(dialog, { opacity: 0, duration: reduce ? 0.01 : 0.35, ease: 'power2.in', onComplete: finish });
  };

  document.querySelectorAll<HTMLButtonElement>('button[data-case]').forEach((button) => {
    const key = button.dataset.case!;
    button.addEventListener('click', () => open(key, button));
    ['pointerenter', 'pointerdown', 'focus'].forEach((type) => button.addEventListener(type, () => warm(key), { passive: true }));
  });

  dialog.querySelector('[data-popup-close]')?.addEventListener('click', close);

  // Esc: вместо мгновенного закрытия браузером — та же плавная анимация
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  // Клик по фону вокруг панели (сам dialog растянут на всё окно)
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });
}
