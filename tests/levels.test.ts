import { describe, expect, it } from 'vitest';
import { PLAYER } from '../src/game/constants';
import { levels } from '../src/game/levels';
import type { LevelData } from '../src/game/types';

const platformUnder = (level: LevelData, x: number, w: number, top: number) =>
  level.platforms.find((p) => p.y === top && x + w > p.x && x < p.x + p.w);

describe.each(levels.map((l) => [l.name, l] as const))('nivel %s', (_name, level) => {
  it('Anubis aparece de pie sobre una plataforma', () => {
    const top = level.player.y + PLAYER.height;
    expect(platformUnder(level, level.player.x, PLAYER.width, top)).toBeDefined();
  });

  it('Anubis no aparece bajo los botones táctiles (zona izquierda)', () => {
    expect(level.player.x).toBeGreaterThanOrEqual(280);
  });

  it('cada bandera está plantada sobre suelo y el respawn cae sobre él', () => {
    expect(level.checkpoints?.length ?? 0).toBeGreaterThan(0);
    for (const cp of level.checkpoints ?? []) {
      expect(platformUnder(level, cp.x, 4, cp.y)).toBeDefined();
      const spawnX = cp.x - PLAYER.width / 2;
      expect(platformUnder(level, spawnX, PLAYER.width, cp.y)).toBeDefined();
      expect(cp.x).toBeGreaterThan(level.player.x);
      expect(cp.x).toBeLessThan(level.goal.x);
    }
  });

  it('las banderas están en orden de avance', () => {
    const xs = (level.checkpoints ?? []).map((c) => c.x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
  });

  it('la meta queda dentro del límite de cámara', () => {
    expect(level.goal.x + level.goal.w).toBeLessThanOrEqual(level.cameraMaxX);
  });
});
