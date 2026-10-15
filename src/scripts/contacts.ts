import { gsap, prefersReducedMotion } from './motion';

// Телефоны в футере: на desktop с курсором клик копирует номер (за курсором едет кнопка
// «копировать», после клика на 2 с — «скопировано»); на остальных устройствах ссылка tel:
// работает как обычно и сразу предлагает позвонить. Почта везде открывает новое письмо (mailto).
const COPIED_LABEL = 'скопировано';
const RESET_DELAY = 2000;
const CURSOR_GAP = 16; // кнопка висит над курсором с этим зазором
const EDGE = 16; // и не выходит за края окна

const desktop = window.matchMedia('(min-width: 1200px) and (hover: hover)');

export function initContacts() {
  initFollow();
  const status = document.querySelector<HTMLElement>('[data-copy-status]');

  document.querySelectorAll<HTMLAnchorElement>('a[data-copy]').forEach((link) => {
    const label = link.querySelector<HTMLElement>('[data-copy-label]');
    const initial = label?.textContent ?? '';
    let timer = 0;

    link.addEventListener('click', async (event) => {
      if (!desktop.matches) return;
      event.preventDefault();
      if (!(await copyText(link.dataset.copy!))) {
        window.location.href = link.href;
        return;
      }
      if (label) label.textContent = COPIED_LABEL;
      if (status) status.textContent = `Номер ${link.dataset.copy} скопирован`;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (label) label.textContent = initial;
      }, RESET_DELAY);
    });
  });
}

// Кнопка следует за курсором с лёгкой инерцией, пока он над номером или почтой
function initFollow() {
  const smooth = prefersReducedMotion() ? 0 : 0.45;

  document.querySelectorAll<HTMLElement>('.contact__value').forEach((link) => {
    const badge = link.querySelector<HTMLElement>('.contact__action');
    if (!badge) return;
    const xTo = gsap.quickTo(badge, 'x', { duration: smooth, ease: 'power3' });
    const yTo = gsap.quickTo(badge, 'y', { duration: smooth, ease: 'power3' });

    // Координаты внутри ссылки: по центру над курсором, с ограничением краями окна
    const target = (clientX: number, clientY: number) => {
      const rect = link.getBoundingClientRect();
      const viewport = document.documentElement.clientWidth;
      const x = Math.min(
        Math.max(clientX - badge.offsetWidth / 2, EDGE),
        viewport - EDGE - badge.offsetWidth,
      );
      return { x: x - rect.left, y: clientY - rect.top - badge.offsetHeight - CURSOR_GAP };
    };

    link.addEventListener('pointerenter', (event) => {
      if (!desktop.matches || event.pointerType !== 'mouse') return;
      // Появляется сразу в точке курсора, без проезда от прошлой позиции
      const { x, y } = target(event.clientX, event.clientY);
      xTo(x, x);
      yTo(y, y);
      link.classList.add('is-hover');
    });

    link.addEventListener('pointermove', (event) => {
      if (!link.classList.contains('is-hover')) return;
      const { x, y } = target(event.clientX, event.clientY);
      xTo(x);
      yTo(y);
    });

    link.addEventListener('pointerleave', () => link.classList.remove('is-hover'));
  });
}

// Clipboard API доступен только в защищённом контексте (https / localhost) — иначе запасной путь
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}
