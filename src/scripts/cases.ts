import { gsap, prefersReducedMotion, ScrollTrigger } from './motion';

// Стек кейсов — механика michaelpumo.com: все карточки sticky; пока следующая карточка едет
// от низа экрана до своей точки прилипания, предыдущая уменьшается 1 → 0.9 от верхнего края
// и равномерно уходит в прозрачность до 0 (к моменту полного перекрытия), а фото въезжающей
// карточки «отъезжает» 1.2 → 1.
const SCALE_TO = 0.9;
const ZOOM_FROM = 1.2;

export function initCases() {
  const cards = [...document.querySelectorAll<HTMLElement>('[data-case-card]')];
  if (!cards.length) return;

  if (prefersReducedMotion()) return;

  const stickyTop = (card: HTMLElement) => parseFloat(getComputedStyle(card).top) || 0;

  cards.forEach((card, i) => {
    const media = card.querySelector<HTMLElement>('[data-case-media]');

    // Фото въезжающей карточки
    if (media) {
      gsap.fromTo(
        media,
        { '--case-zoom': ZOOM_FROM },
        {
          '--case-zoom': 1,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: () => `top ${stickyTop(card)}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        },
      );
    }

    // Предыдущая карточка уходит «вглубь», пока на неё наезжает следующая
    const next = cards[i + 1];
    if (!next) return;
    const inner = card.querySelector<HTMLElement>('.case__inner')!;
    const scrollTrigger = () => ({
      trigger: next,
      start: 'top bottom',
      end: () => `top ${stickyTop(next)}px`,
      scrub: true,
      invalidateOnRefresh: true,
    });
    gsap.fromTo(inner, { scale: 1 }, { scale: SCALE_TO, ease: 'power1.out', scrollTrigger: scrollTrigger() });
    gsap.fromTo(inner, { opacity: 1 }, { opacity: 0, ease: 'none', scrollTrigger: scrollTrigger() });
  });

  ScrollTrigger.refresh();
}
