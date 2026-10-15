import { EASE, gsap, lenis, prefersReducedMotion } from './motion';

export function initMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !menu) return;

  const items = menu.querySelectorAll<HTMLElement>('.menu__item');
  const labels = menu.querySelectorAll<HTMLElement>('.menu__item span');
  let open = false;

  const setOpen = (next: boolean) => {
    if (open === next) return;
    open = next;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.documentElement.classList.toggle('menu-open', open);

    gsap.killTweensOf([menu, labels]);
    if (open) {
      menu.hidden = false;
      lenis?.stop();
      if (!prefersReducedMotion()) {
        gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: EASE });
        gsap.fromTo(labels, { yPercent: 110 }, { yPercent: 0, duration: 0.8, ease: EASE, stagger: 0.07, delay: 0.1 });
      }
      items[0]?.focus({ preventScroll: true });
    } else {
      lenis?.start();
      const hide = () => {
        menu.hidden = true;
      };
      if (prefersReducedMotion()) hide();
      else gsap.to(menu, { opacity: 0, duration: 0.35, ease: EASE, onComplete: hide });
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  // Пункты — якоря: закрываем меню, а прокрутку делает общий обработчик якорей
  items.forEach((item) => item.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && open) {
      setOpen(false);
      toggle.focus();
    }
  });
  // Если окно расширили до desktop с открытым меню — закрываем
  window.matchMedia('(min-width: 1200px)').addEventListener('change', (event) => {
    if (event.matches) setOpen(false);
  });
}
