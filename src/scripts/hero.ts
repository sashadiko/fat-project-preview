import { EASE, gsap, prefersReducedMotion, SplitText } from './motion';

// Скорость ленты в пикселях макета в секунду (у gastrodvorr ~52 px/s при карточке 288 px;
// у нас карточка 415 px, поэтому скорость пропорционально выше).
const LANE_SPEED = 60;

export function initHeroLane() {
  const hero = document.querySelector<HTMLElement>('.hero');
  const track = document.querySelector<HTMLElement>('[data-hero-track]');
  if (!hero || !track) return;

  const originals = [...track.children] as HTMLElement[];
  originals.forEach((node) => {
    const clone = node.cloneNode(true) as HTMLImageElement;
    clone.alt = '';
    clone.setAttribute('aria-hidden', 'true');
    track.append(clone);
  });

  // Сдвиг = расстояние до первого клона (ширина набора + gap), чтобы стык был бесшовным
  const measure = () => {
    const shift = (track.children[originals.length] as HTMLElement).offsetLeft;
    const unit = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--u')) || 1;
    track.style.setProperty('--hero-shift', `${-shift}px`);
    track.style.setProperty('--hero-duration', `${shift / unit / LANE_SPEED}s`);
  };
  measure();
  new ResizeObserver(measure).observe(track);

  // Не гоняем анимацию, пока hero вне экрана
  new IntersectionObserver(([entry]) => hero.classList.toggle('is-offscreen', !entry.isIntersecting)).observe(hero);
}

// Вход первого экрана — тайминги intro у Mammut: шапка падает, строки заголовка
// выезжают из маски (0.12s + i·0.1s), затем плашки (0.35s / 0.45s).
// Лента в intro не участвует: как у gastrodvorr, она видна и едет с первого кадра.
export function playIntro() {
  const root = document.documentElement;
  if (prefersReducedMotion()) {
    root.classList.add('is-ready');
    return;
  }

  const title = document.querySelector<HTMLElement>('[data-intro="title"]');
  const split = title ? new SplitText(title, { type: 'lines', mask: 'lines', linesClass: 'reveal-line' }) : null;

  // Снимаем CSS-скрытие обычным gsap.set до создания твинов (from берёт текущее значение как
  // конечное), а не set внутри таймлайна: тот перерисовывается на первом тике и на долю секунды
  // показывает плашки до начала их анимации. Стартовые состояния ставят сами from-твины
  // (immediateRender) в том же синхронном проходе, поэтому промежуточный кадр не отрисуется.
  gsap.set('[data-intro]', { opacity: 1 });
  root.classList.add('is-ready');

  const tl = gsap.timeline({ defaults: { ease: EASE } });

  tl.from('[data-intro="nav"]', { yPercent: -40, opacity: 0, duration: 0.6 }, 0);
  if (split) tl.from(split.lines, { yPercent: 115, duration: 0.9, stagger: 0.1 }, 0.12);
  tl.from('[data-intro="point"]', { y: 20, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.35);
}
