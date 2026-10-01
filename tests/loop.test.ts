import { describe, expect, it } from 'vitest';
import { FIXED_STEP_MS, MAX_VIEW_WIDTH, MIN_VIEW_WIDTH, viewWidthForAspect } from '../src/game/constants';
import { createFixedStepper } from '../src/game/loop';

const runFor = (hz: number, seconds: number) => {
  const stepper = createFixedStepper();
  let ticks = 0;
  const frameMs = 1000 / hz;
  for (let t = 0; t <= seconds * 1000 + 0.001; t += frameMs) {
    stepper.advance(t, () => { ticks++; });
  }
  return ticks;
};

describe('fixed stepper', () => {
  it('simula ~60 pasos por segundo sin importar los Hz de la pantalla', () => {
    for (const hz of [30, 60, 90, 120, 144]) {
      const ticks = runFor(hz, 2);
      expect(Math.abs(ticks - 120)).toBeLessThanOrEqual(2);
    }
  });

  it('no intenta recuperar segundos perdidos tras volver de segundo plano', () => {
    const stepper = createFixedStepper();
    let ticks = 0;
    stepper.advance(0, () => ticks++);
    stepper.advance(10_000, () => ticks++);
    expect(ticks).toBeLessThanOrEqual(5);
  });

  it('el paso fijo es 1/60 s', () => {
    expect(FIXED_STEP_MS).toBeCloseTo(16.667, 2);
  });
});

describe('viewWidthForAspect', () => {
  it('mantiene 800 en 4:3 y se ensancha en celulares horizontales', () => {
    expect(viewWidthForAspect(4 / 3)).toBe(800);
    const phone = viewWidthForAspect(844 / 390);
    expect(phone).toBeGreaterThan(1200);
    expect(phone).toBeLessThanOrEqual(MAX_VIEW_WIDTH);
  });

  it('respeta los límites ante proporciones extremas o inválidas', () => {
    expect(viewWidthForAspect(0.5)).toBe(MIN_VIEW_WIDTH);
    expect(viewWidthForAspect(10)).toBe(MAX_VIEW_WIDTH);
    expect(viewWidthForAspect(NaN)).toBe(800);
  });
});
