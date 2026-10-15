import { gsap, ScrollTrigger } from './motion';

// Стопка цехов на tablet/mobile — та же механика, что у кейсов в портфолио (michaelpumo.com),
// только по горизонтали и от вертикального скролла. Трек липнет в окне, пока скроллится
// высокая обёртка; каждая следующая карточка въезжает из-за правого края поверх предыдущей,
// а предыдущая уменьшается 1 → 0.9 и равномерно уходит в прозрачность до 0 — как кейсы в портфолио.
const MIN_SCALE = 0.9;
const STEP = 0.75; // ход скролла на одну карточку, доля высоты окна
const EDGE = 24; // минимальный отступ липкого трека от краёв окна

const easeOut = gsap.parseEase('power1.out');
const clamp = (value: number) => Math.min(Math.max(value, 0), 1);

export function initShops() {
  const stage = document.querySelector<HTMLElement>('[data-shops-stage]');
  const track = stage?.querySelector<HTMLElement>('[data-shops]');
  if (!stage || !track) return;

  const inners = [...track.querySelectorAll<HTMLElement>('.shop__inner')];
  if (inners.length < 2) return;
  const last = inners.length - 1;

  gsap.matchMedia().add('(max-width: 1199px) and (prefers-reduced-motion: no-preference)', () => {
    let top = 0;
    let travel = 0;
    let enterX = 0;

    // На tablet трек по центру окна (как карточки кейсов), на mobile прижат к низу окна с отступом 24 —
    // так под карточкой нет пустоты. Высота обёртки = трек + ход на каждую карточку.
    const mobile = window.matchMedia('(max-width: 767px)');
    const layout = () => {
      const vh = window.innerHeight;
      const height = track.offsetHeight;
      top = mobile.matches ? vh - height - EDGE : Math.min(Math.max((vh - height) / 2, EDGE), vh - height - EDGE);
      travel = Math.round(vh * STEP);
      // Стартовая позиция въезжающей карточки — сразу за правым краем окна, её не видно
      enterX = document.documentElement.clientWidth - track.getBoundingClientRect().left;
      // На mobile — через dvh: адресная строка меняет высоту окна, а отступ снизу должен остаться 24
      track.style.setProperty('--shops-top', mobile.matches ? `calc(100dvh - ${height + EDGE}px)` : `${top}px`);
      stage.style.height = `${height + travel * last}px`;
    };

    const render = (progress: number) => {
      const p = progress * last;
      inners.forEach((inner, i) => {
        const enter = i === 0 ? 1 : clamp(p - (i - 1));
        const leave = i === last ? 0 : clamp(p - i);
        inner.style.transform = `translate3d(${(1 - enter) * enterX}px, 0, 0) scale(${1 - (1 - MIN_SCALE) * easeOut(leave)})`;
        inner.style.opacity = `${1 - leave}`;
      });
    };

    layout();
    render(0);

    const trigger = ScrollTrigger.create({
      trigger: stage,
      start: () => `top ${top}px`,
      end: () => `+=${travel * last}`,
      invalidateOnRefresh: true,
      onRefreshInit: layout,
      onRefresh: (self) => render(self.progress),
      onUpdate: (self) => render(self.progress),
    });

    return () => {
      trigger.kill();
      stage.style.height = '';
      track.style.removeProperty('--shops-top');
      inners.forEach((inner) => {
        inner.style.transform = '';
        inner.style.opacity = '';
      });
    };
  });
}
