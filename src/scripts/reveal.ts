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

// Счётчики 0 → N. Ширина плашки жёстко фиксируется по финальному значению, текст по центру —
// поэтому коробка не прыгает. Все счётчики группы стартуют вместе от одного триггера и идут
// одним твином, а значение округляется вниз — так каждая цифра становится финальной
// ровно в последний кадр и все четыре заканчивают одновременно. Срабатывает один раз.
const COUNTER_DURATION = 1.2;

function initCounters() {
  const counters = [...document.querySelectorAll<HTMLElement>('[data-counter]')];
  if (!counters.length) return;

  const items = counters.map((el) => {
    const target = Number(el.dataset.counter);
    const suffix = el.dataset.suffix ?? '';
    const final = `${target}${suffix}`;
    const lockWidth = () => {
      const current = el.textContent;
      el.style.width = '';
      el.textContent = final;
      el.style.width = `${el.getBoundingClientRect().width}px`;
      el.textContent = current;
    };
    lockWidth();
    window.addEventListener('resize', lockWidth);
    el.textContent = `0${suffix}`;
    return { el, target, suffix };
  });

  const state = { progress: 0 };
  const render = () =>
    items.forEach(({ el, target, suffix }) => {
      const value = state.progress >= 1 ? target : Math.floor(target * state.progress);
      el.textContent = `${value}${suffix}`;
    });

  // Старт — когда в окно вошла последняя цифра: на tablet/mobile цифры стоят столбиком, и при старте
  // по верху группы нижние досчитывали бы за пределами экрана
  ScrollTrigger.create({
    trigger: counters[counters.length - 1],
    start: 'bottom 95%',
    once: true,
    onEnter: () => {
      gsap.to(state, { progress: 1, duration: COUNTER_DURATION, ease: 'power1.out', delay: 0.15, onUpdate: render });
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
