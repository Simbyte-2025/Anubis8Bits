export type GameScreen = 'menu' | 'levelSelect' | 'playing' | 'paused' | 'won' | 'lost' | 'gameComplete' | 'settings';

export type ControlMode = 'visible' | 'zones' | 'both';

export type SpeedPreset = 'slow' | 'normal' | 'fast';

export type LevelTheme = 'day' | 'night' | 'desert' | 'rooftops';

export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends AABB {
  isGoal?: boolean;
  isHazard?: boolean;
}

export interface Coin extends AABB {
  collected: boolean;
}

export type EnemyKind = 'bat' | 'beetle';

export interface Enemy extends AABB {
  kind: EnemyKind;
  vx: number;
  vy: number;
  patrolMin: number;
  patrolMax: number;
  baseY: number;
  alive: boolean;
  animFrame: number;
}

export type PowerUpKind = 'doubleJump' | 'shield' | 'extraLife';

export interface PowerUp extends AABB {
  kind: PowerUpKind;
  collected: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  facingRight: boolean;
  scale: number;
  animFrame: number;
  lives: number;
  invulnerableFrames: number;
  coyoteFrames: number;
  jumpBufferFrames: number;
  hasDoubleJump: boolean;
  doubleJumpUsed: boolean;
  hasShield: boolean;
  shieldFrames: number;
  spawnX: number;
  spawnY: number;
}

export interface LevelData {
  id: number;
  name: string;
  theme: LevelTheme;
  cameraMaxX: number;
  player: { x: number; y: number };
  platforms: Platform[];
  coins: Omit<Coin, 'collected'>[];
  enemies: Omit<Enemy, 'vx' | 'vy' | 'baseY' | 'alive' | 'animFrame'>[];
  powerUps: Omit<PowerUp, 'collected'>[];
  goal: Platform;
}

export interface GameState {
  screen: GameScreen;
  currentLevelId: number;
  cameraX: number;
  score: number;
  totalScore: number;
  frameCount: number;
  player: Player;
  platforms: Platform[];
  coins: Coin[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  particles: Particle[];
  goal: Platform | null;
  cameraMaxX: number;
  theme: LevelTheme;
  speedMultiplier: number;
}

export interface InputKeys {
  ArrowLeft: boolean;
  ArrowRight: boolean;
  ArrowUp: boolean;
  Space: boolean;
  KeyP: boolean;
}
