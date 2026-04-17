export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const COLORS = {
  sky: '#FFB6C1',
  skyNight: '#1f2540',
  ground: '#98FB98',
  groundNight: '#3a6b54',
  dirt: '#CD853F',
  dirtNight: '#5b3a25',
  catBase: '#F5F5DC',
  catPoints: '#4B3621',
  catEye: '#87CEEB',
  catSocks: '#FFFFFF',
  coin: '#FFD700',
  coinShine: '#FFF',
  bat: '#3a2a4a',
  batWing: '#1a0e2a',
  beetle: '#2e8b57',
  beetleShell: '#0a3a1a',
  spike: '#cccccc',
  spikeBase: '#666',
  shield: '#7ec8ff',
  doubleJump: '#ffe066',
  heart: '#ff4d6d',
  goal: '#FF69B4',
  goalDark: '#C71585',
  particle: '#fff',
  hudShadow: '#000'
} as const;

export const PHYSICS = {
  gravity: 0.5,
  maxFallSpeed: 15,
  jumpPower: -16,
  doubleJumpPower: -14,
  playerSpeed: 8,
  airFriction: 0.92,
  groundFriction: 0.8,
  coyoteTimeFrames: 6,
  jumpBufferFrames: 7
} as const;

export const PLAYER = {
  width: 80,
  height: 52,
  scale: 4,
  hitboxInsetX: 18,
  hitboxInsetY: 8,
  startLives: 3,
  invulnerabilityFrames: 90,
  knockbackX: 6,
  knockbackY: -10
} as const;

export const STORAGE_KEYS = {
  highScore: 'kittenJump.highScore',
  unlockedLevel: 'kittenJump.unlockedLevel',
  controlMode: 'kittenJump.controlMode'
} as const;
