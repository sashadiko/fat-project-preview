import { EASE, gsap, prefersReducedMotion, ScrollTrigger, SplitText } from './motion';

// Механика Mammut Studios: старт, когда верх элемента доходит до 88% высоты окна;
// если прокрутить обратно выше элемента — анимация сбрасывается и сыграет снова.
const START = 'top 88%';

function bindReplay(trigger: Element, tween: gsap.core.Animation) {
  ScrollTrigger.create({ trigger, start: START, onEnter: () => tween.restart() });
  ScrollTrigger.create({ trigger, start: 'top bottom', onLeaveBack: () => tween.pause(0) });
}

// data-reveal="lines" — строки выезжают снизу из маски
function initLines() {
  document.querySelectorAll<HTMLElement>('[data-reveal="lines"]').forEach((el) => {
    // Триггеры создаются один раз; при ресайзе SplitText пересобирает строки и подменяет анимацию
    let tween: gsap.core.Tween | null = null;
    let played = false;

    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      linesClass: 'reveal-line',
      autoSplit: true,
      onSplit(self) {
        tween = gsap.fromTo(
          self.lines,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.9, ease: EASE, stagger: 0.09, paused: true },
        );
        if (played) tween.progress(1);
        return tween;
      },
    });

    ScrollTrigger.create({
      trigger: el,
      start: START,
      onEnter: () => {
        played = true;
        tween?.restart();
      },
    });
    ScrollTrigger.create({
      trigger: el,
      start: 'top bottom',
      onLeaveBack: () => {
        played = false;
        tween?.pause(0);
      },
    });
  });
}

// data-reveal="up" и группы data-reveal-group > data-reveal-item — плашки/карточки: прозрачность + подъём
function initUp() {
  document.querySelectorAll<HTMLElement>('[data-reveal="up"]').forEach((el) => {
    const tween = gsap.fromTo(el, { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.9, ease: EASE, paused: true });
    bindReplay(el, tween);
  });

  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    const items = group.querySelectorAll<HTMLElement>('[data-reveal-item]');
    const stagger = Number(group.dataset.revealStagger ?? 0.12);
    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 32 },
      { opacity: 1, y: 0, duration: 0.9, ease: EASE, stagger, paused: true },
    );
    bindReplay(group, tween);
  });
}

// Счётчики 0 → N. Плашка подстраивается под текущее число (растёт вместе с ним), текст прижат
// влево. Все счётчики группы стартуют вместе и идут одним твином, а значение округляется вниз —
// так каждая цифра становится финальной ровно в последний кадр и все четыре заканчивают
// одновременно. Срабатывает один раз.
const COUNTER_DURATION = 1.2;

function initCounters() {
  const counters = [...document.querySelectorAll<HTMLElement>('[data-counter]')];
  if (!counters.length) return;

  const items = counters.map((el) => {
    const suffix = el.dataset.suffix ?? '';
    el.textContent = `0${suffix}`;
    return { el, target: Number(el.dataset.counter), suffix };
  });

  const state = { progress: 0 };
  const render = () =>
    items.forEach(({ el, target, suffix }) => {
      const value = state.progress >= 1 ? target : Math.floor(target * state.progress);
      el.textContent = `${value}${suffix}`;
    });

  // Старт вместе с появлением цифр (как у остальных плашек — верх группы на 88% окна).
  // На mobile цифры стоят столбиком — ждём, пока в окне окажется половина столбика,
  // чтобы нижние не досчитали за краем экрана
  const group = counters[0].closest('[data-reveal-group]') ?? counters[0];
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  ScrollTrigger.create({
    trigger: group,
    start: mobile ? 'center bottom' : START,
    once: true,
    onEnter: () => {
      gsap.to(state, { progress: 1, duration: COUNTER_DURATION, ease: 'power1.out', delay: 0.1, onUpdate: render });
    },
  });
}

export function initReveal() {
  if (prefersReducedMotion()) return;
  initLines();
  initUp();
  initCounters();
  ScrollTrigger.refresh();
}
