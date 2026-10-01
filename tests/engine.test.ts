import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_HEIGHT, PLAYER, VIEW } from '../src/game/constants';
import { createInitialState, loadLevel, update } from '../src/game/engine';
import { getLevel } from '../src/game/levels';
import type { GameState, InputKeys } from '../src/game/types';

const keys = (partial: Partial<InputKeys> = {}): InputKeys => ({
  ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false, KeyP: false,
  ...partial
});

const noop = () => {};

const run = (state: GameState, frames: number, input: Partial<InputKeys> = {}) => {
  for (let i = 0; i < frames; i++) update(state, keys(input), noop, noop);
};

const fresh = (levelId = 1) => {
  const state = createInitialState();
  loadLevel(state, levelId, false);
  return state;
};

beforeEach(() => {
  VIEW.width = 800;
});

describe('engine', () => {
  it('carga el nivel con Anubis en el suelo y banderas inactivas', () => {
    const state = fresh();
    expect(state.screen).toBe('playing');
    expect(state.checkpoints.length).toBeGreaterThan(0);
    expect(state.checkpoints.every((c) => !c.active)).toBe(true);
    run(state, 5);
    expect(state.player.isGrounded).toBe(true);
  });

  it('avanza a la derecha y la cámara la sigue', () => {
    const state = fresh();
    const x0 = state.player.x;
    run(state, 60, { ArrowRight: true });
    expect(state.player.x).toBeGreaterThan(x0 + 200);
    expect(state.player.facingRight).toBe(true);
    const screenX = state.player.x - state.cameraX;
    expect(screenX).toBeGreaterThanOrEqual(0);
    expect(screenX).toBeLessThanOrEqual(VIEW.width * 0.5 + 1);
  });

  it('la cámara usa el ancho visible actual (pantallas anchas)', () => {
    VIEW.width = 1300;
    const state = fresh();
    state.player.x = 2000;
    run(state, 1);
    expect(state.cameraX).toBeLessThanOrEqual(state.cameraMaxX - 1300);
    expect(state.player.x - state.cameraX).toBeLessThanOrEqual(1300 * 0.5 + 1);
  });

  it('activa la bandera al pasarla y reaparece ahí tras caer', () => {
    const state = fresh();
    const cp = state.checkpoints[0];
    state.player.x = cp.x - 20;
    state.player.y = cp.y - PLAYER.height;
    run(state, 2);
    expect(cp.active).toBe(true);
    const lives = state.player.lives;

    state.player.x = cp.x + 700; // sobre un hueco
    state.player.y = GAME_HEIGHT + 200;
    run(state, 1);
    expect(state.player.lives).toBe(lives - 1);
    expect(Math.abs(state.player.x - (cp.x - PLAYER.width / 2))).toBeLessThan(1);
    expect(state.player.invulnerableFrames).toBeGreaterThan(0);
    run(state, 60);
    expect(state.player.isGrounded).toBe(true);
    expect(state.screen).toBe('playing');
  });

  it('sin bandera, caer devuelve al inicio del nivel', () => {
    const state = fresh();
    const start = getLevel(1)!.player;
    state.player.x = 550;
    state.player.y = GAME_HEIGHT + 200;
    run(state, 1);
    expect(state.player.x).toBe(start.x);
  });

  it('con vidas infinitas, caer nunca termina la partida', () => {
    const state = fresh();
    state.infiniteLives = true;
    state.player.lives = 1;
    for (let i = 0; i < 5; i++) {
      state.player.y = GAME_HEIGHT + 200;
      run(state, 1);
    }
    expect(state.player.lives).toBe(1);
    expect(state.screen).toBe('playing');
  });

  it('sin vidas infinitas, la última caída termina la partida', () => {
    const state = fresh();
    state.player.lives = 1;
    state.player.y = GAME_HEIGHT + 200;
    run(state, 1);
    expect(state.screen).toBe('lost');
  });

  it('con vidas infinitas, los golpes de enemigos no quitan vidas', () => {
    const state = fresh();
    state.infiniteLives = true;
    const enemy = state.enemies.find((e) => e.kind === 'beetle')!;
    const lives = state.player.lives;
    state.player.x = enemy.x;
    state.player.y = enemy.y;
    state.player.vy = 0;
    run(state, 1);
    expect(state.player.invulnerableFrames).toBeGreaterThan(0);
    expect(state.player.lives).toBe(lives);
  });

  it('llegar a la meta gana el nivel', () => {
    const state = fresh();
    let won = false;
    state.player.x = state.goal!.x + 10;
    state.player.y = state.goal!.y - PLAYER.height + 4;
    update(state, keys(), noop, () => { won = true; });
    expect(won).toBe(true);
    expect(state.screen).toBe('won');
  });
});
