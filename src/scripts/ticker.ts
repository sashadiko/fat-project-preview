import { gsap, lenis, prefersReducedMotion } from './motion';

// Бесконечная строка с механикой flshfrm.com: постоянная скорость (~90 px/s у них при 150px шрифте),
// направление следует за последним направлением скролла, быстрый скролл разгоняет строку
// примерно в 3.5 раза, после чего она плавно (~1 s) возвращается к базовой скорости.
const BASE_SPEED = 90; // пиксели макета в секунду
const MAX_BOOST = 3.2;
const BOOST_PER_VELOCITY = 0.3; // прирост множителя на 1 px/кадр скорости скролла
const BOOST_DECAY = 3; // скорость затухания разгона, 1/с

export function initTicker() {
  const track = document.querySelector<HTMLElement>('[data-ticker]');
  const section = track?.closest<HTMLElement>('.ticker');
  if (!track || !section) return;

  const set = track.querySelector<HTMLElement>('.ticker__set')!;

  // Копий столько, чтобы лента всегда перекрывала повёрнутую полосу с запасом
  const fill = () => {
    track.querySelectorAll('.ticker__set + .ticker__set').forEach((node) => node.remove());
    const copies = Math.max(1, Math.ceil(track.parentElement!.offsetWidth / set.offsetWidth));
    for (let i = 0; i < copies; i++) track.append(set.cloneNode(true));
  };
  fill();

  if (prefersReducedMotion()) return;

  const unit = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;

  // Стартовая позиция как в Figma: левый край полосы на −2172 от края кадра 1920
  let setWidth = set.offsetWidth;
  let x = -((2172 * unit()) % setWidth);
  let direction = -1; // −1 — влево (скролл вниз), 1 — вправо (скролл вверх)
  let boost = 1;
  let visible = false;

  new IntersectionObserver(([entry]) => (visible = entry.isIntersecting)).observe(section);

  lenis?.on('scroll', ({ velocity }: { velocity: number }) => {
    if (velocity === 0) return;
    direction = velocity > 0 ? -1 : 1;
    boost = Math.max(boost, Math.min(1 + Math.abs(velocity) * BOOST_PER_VELOCITY, MAX_BOOST));
  });

  // Без Lenis (тач) направление берём из нативного скролла
  if (!lenis) {
    let lastY = window.scrollY;
    window.addEventListener(
      'scroll',
      () => {
        const delta = window.scrollY - lastY;
        lastY = window.scrollY;
        if (!delta) return;
        direction = delta > 0 ? -1 : 1;
        boost = Math.max(boost, Math.min(1 + Math.abs(delta) * BOOST_PER_VELOCITY, MAX_BOOST));
      },
      { passive: true },
    );
  }

  window.addEventListener('resize', () => {
    fill();
    setWidth = set.offsetWidth;
  });

  gsap.ticker.add((_time, deltaMs) => {
    const dt = Math.min(deltaMs, 50) / 1000;
    boost += (1 - boost) * Math.min(BOOST_DECAY * dt, 1);
    if (!visible) return;
    x += direction * BASE_SPEED * unit() * boost * dt;
    // Держим x в диапазоне (−setWidth, 0] — стык набора с копией невидим
    x = ((x % setWidth) - setWidth) % setWidth;
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  });
}
