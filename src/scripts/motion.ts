import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText);

// Ease из референса Mammut Studios (= cubic-bezier(.625,.05,0,1), он же --ease в CSS)
export const EASE = CustomEase.create('osmo', 'M0,0 C0.625,0.05 0,1 1,1');

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export let lenis: Lenis | null = null;

export function initSmoothScroll() {
  if (prefersReducedMotion()) return;

  lenis = new Lenis();
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  document.addEventListener('click', (event) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || !lenis) return;
    const id = link.getAttribute('href')!;
    const target = id === '#top' ? 0 : document.querySelector<HTMLElement>(id);
    if (target === null) return;
    event.preventDefault();
    lenis.scrollTo(target, { duration: 1.2 });
  });
}

export { gsap, ScrollTrigger, SplitText };
