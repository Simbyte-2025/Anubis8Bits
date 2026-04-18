import type { EnemyKind } from '../types';

export type BattleScreen = 'intro' | 'fighting' | 'won' | 'lost';
export type BattlePlayerState = 'idle' | 'attacking' | 'hurt';
export type BattleEnemyState = 'idle' | 'telegraph' | 'attack' | 'hurt' | 'defeated';

export interface BattleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface BattlePlayer {
  x: number;
  baseX: number;
  y: number;
  baseY: number;
  scale: number;
  baseScale: number;
  state: BattlePlayerState;
  animTimer: number;
  invuln: number;
  speed: number;
}

export interface BattleEnemy {
  kind: EnemyKind;
  x: number;
  baseX: number;
  y: number;
  baseY: number;
  scale: number;
  baseScale: number;
  hp: number;
  maxHp: number;
  state: BattleEnemyState;
  timer: number;
  startX: number;
  targetX: number;
  invuln: number;
  damage: number;
  attackInterval: number;
  telegraphFrames: number;
  lungeFrames: number;
}

export interface BattleState {
  screen: BattleScreen;
  frame: number;
  player: BattlePlayer;
  enemy: BattleEnemy;
  worldEnemyIndex: number;
  particles: BattleParticle[];
  screenShake: number;
  introTimer: number;
  outcomeTimer: number;
  attackPressedPrev: boolean;
}
