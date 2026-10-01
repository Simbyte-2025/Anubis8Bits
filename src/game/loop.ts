import { FIXED_STEP_MS } from './constants';

// Máximo de pasos por cuadro: si la pestaña estuvo en segundo plano no
// intentamos "recuperar" segundos de simulación de golpe.
const MAX_STEPS_PER_FRAME = 5;

export interface FixedStepper {
  /** Avanza el reloj hasta `now` (ms) y ejecuta `tick` tantas veces como pasos fijos correspondan. */
  advance: (now: number, tick: () => void) => number;
  reset: () => void;
}

export const createFixedStepper = (stepMs = FIXED_STEP_MS): FixedStepper => {
  let last: number | null = null;
  let acc = 0;

  return {
    advance(now, tick) {
      if (last === null) {
        last = now;
        return 0;
      }
      acc += Math.max(0, Math.min(now - last, 250));
      last = now;
      let steps = 0;
      while (acc >= stepMs && steps < MAX_STEPS_PER_FRAME) {
        tick();
        acc -= stepMs;
        steps++;
      }
      if (steps === MAX_STEPS_PER_FRAME) acc = 0;
      return steps;
    },
    reset() {
      last = null;
      acc = 0;
    }
  };
};
