import type { LevelData } from './types';

const groundY = 500;
const groundH = 100;

export const levels: LevelData[] = [
  {
    id: 1,
    name: 'Yvága rape',
    theme: 'day',
    cameraMaxX: 3200,
    player: { x: 50, y: groundY - 52 },
    platforms: [
      { x: 0, y: groundY, w: 500, h: groundH },
      { x: 600, y: 420, w: 140, h: 24 },
      { x: 820, y: 360, w: 120, h: 24 },
      { x: 1020, y: 300, w: 140, h: 24 },
      { x: 1240, y: 380, w: 180, h: 24 },
      { x: 1480, y: 440, w: 220, h: 24 },
      { x: 1750, y: groundY, w: 600, h: groundH },
      { x: 2400, y: 420, w: 160, h: 24 },
      { x: 2620, y: 340, w: 160, h: 24 },
      { x: 2840, y: 280, w: 200, h: 24 }
    ],
    coins: [
      { x: 660, y: 380, w: 20, h: 20 },
      { x: 870, y: 320, w: 20, h: 20 },
      { x: 1080, y: 260, w: 20, h: 20 },
      { x: 1320, y: 340, w: 20, h: 20 },
      { x: 1560, y: 400, w: 20, h: 20 },
      { x: 1900, y: 460, w: 20, h: 20 },
      { x: 2050, y: 460, w: 20, h: 20 },
      { x: 2200, y: 460, w: 20, h: 20 },
      { x: 2470, y: 380, w: 20, h: 20 },
      { x: 2700, y: 300, w: 20, h: 20 }
    ],
    enemies: [
      { kind: 'beetle', x: 1830, y: groundY - 32, w: 36, h: 32, patrolMin: 1760, patrolMax: 2300 },
      { kind: 'bat', x: 1100, y: 200, w: 36, h: 28, patrolMin: 1000, patrolMax: 1400 }
    ],
    powerUps: [
      { kind: 'doubleJump', x: 1480, y: 400, w: 24, h: 24 }
    ],
    goal: { x: 3050, y: 280, w: 150, h: 24, isGoal: true }
  },
  {
    id: 2,
    name: 'Pyhare guasu',
    theme: 'night',
    cameraMaxX: 4000,
    player: { x: 50, y: groundY - 52 },
    platforms: [
      { x: 0, y: groundY, w: 320, h: groundH },
      { x: 420, y: 460, w: 100, h: 24 },
      { x: 600, y: 400, w: 100, h: 24 },
      { x: 780, y: 340, w: 100, h: 24 },
      { x: 960, y: 280, w: 120, h: 24 },
      { x: 1180, y: 340, w: 100, h: 24 },
      { x: 1380, y: 400, w: 100, h: 24 },
      { x: 1560, y: groundY, w: 500, h: groundH },
      { x: 2160, y: 440, w: 80, h: 24 },
      { x: 2300, y: 360, w: 80, h: 24 },
      { x: 2440, y: 280, w: 80, h: 24 },
      { x: 2580, y: 200, w: 100, h: 24 },
      { x: 2780, y: 280, w: 80, h: 24 },
      { x: 2920, y: 360, w: 80, h: 24 },
      { x: 3060, y: 440, w: 80, h: 24 },
      { x: 3200, y: groundY, w: 800, h: groundH }
    ],
    coins: [
      { x: 460, y: 420, w: 20, h: 20 },
      { x: 640, y: 360, w: 20, h: 20 },
      { x: 820, y: 300, w: 20, h: 20 },
      { x: 1010, y: 240, w: 20, h: 20 },
      { x: 1220, y: 300, w: 20, h: 20 },
      { x: 1420, y: 360, w: 20, h: 20 },
      { x: 1700, y: 460, w: 20, h: 20 },
      { x: 1850, y: 460, w: 20, h: 20 },
      { x: 2000, y: 460, w: 20, h: 20 },
      { x: 2200, y: 400, w: 20, h: 20 },
      { x: 2340, y: 320, w: 20, h: 20 },
      { x: 2480, y: 240, w: 20, h: 20 },
      { x: 2620, y: 160, w: 20, h: 20 },
      { x: 2820, y: 240, w: 20, h: 20 },
      { x: 2960, y: 320, w: 20, h: 20 },
      { x: 3100, y: 400, w: 20, h: 20 }
    ],
    enemies: [
      { kind: 'bat', x: 700, y: 220, w: 36, h: 28, patrolMin: 600, patrolMax: 1100 },
      { kind: 'bat', x: 1300, y: 180, w: 36, h: 28, patrolMin: 1200, patrolMax: 1500 },
      { kind: 'beetle', x: 1700, y: groundY - 32, w: 36, h: 32, patrolMin: 1620, patrolMax: 2050 },
      { kind: 'bat', x: 2600, y: 120, w: 36, h: 28, patrolMin: 2500, patrolMax: 2800 },
      { kind: 'beetle', x: 3400, y: groundY - 32, w: 36, h: 32, patrolMin: 3300, patrolMax: 3850 }
    ],
    powerUps: [
      { kind: 'shield', x: 1610, y: groundY - 40, w: 24, h: 24 },
      { kind: 'doubleJump', x: 2600, y: 160, w: 24, h: 24 }
    ],
    goal: { x: 3850, y: 380, w: 150, h: 24, isGoal: true }
  },
  {
    id: 3,
    name: 'Yvy aku',
    theme: 'desert',
    cameraMaxX: 5000,
    player: { x: 50, y: groundY - 52 },
    platforms: [
      { x: 0, y: groundY, w: 280, h: groundH },
      { x: 380, y: 480, w: 70, h: 24 },
      { x: 520, y: 420, w: 70, h: 24 },
      { x: 660, y: 360, w: 70, h: 24 },
      { x: 800, y: 300, w: 70, h: 24 },
      { x: 940, y: 240, w: 80, h: 24 },
      { x: 1100, y: 300, w: 70, h: 24 },
      { x: 1240, y: 380, w: 70, h: 24 },
      { x: 1380, y: groundY, w: 220, h: groundH },
      { x: 1700, y: 460, w: 60, h: 24 },
      { x: 1840, y: 380, w: 60, h: 24 },
      { x: 1980, y: 300, w: 60, h: 24 },
      { x: 2120, y: 220, w: 80, h: 24 },
      { x: 2280, y: 300, w: 60, h: 24 },
      { x: 2420, y: 380, w: 60, h: 24 },
      { x: 2560, y: 460, w: 60, h: 24 },
      { x: 2700, y: groundY, w: 300, h: groundH },
      { x: 3100, y: 440, w: 70, h: 24 },
      { x: 3240, y: 360, w: 70, h: 24 },
      { x: 3380, y: 280, w: 70, h: 24 },
      { x: 3520, y: 200, w: 80, h: 24 },
      { x: 3680, y: 280, w: 70, h: 24 },
      { x: 3820, y: 360, w: 70, h: 24 },
      { x: 3960, y: 440, w: 70, h: 24 },
      { x: 4100, y: groundY, w: 800, h: groundH }
    ],
    coins: [
      { x: 410, y: 440, w: 20, h: 20 },
      { x: 550, y: 380, w: 20, h: 20 },
      { x: 690, y: 320, w: 20, h: 20 },
      { x: 830, y: 260, w: 20, h: 20 },
      { x: 980, y: 200, w: 20, h: 20 },
      { x: 1130, y: 260, w: 20, h: 20 },
      { x: 1270, y: 340, w: 20, h: 20 },
      { x: 1730, y: 420, w: 20, h: 20 },
      { x: 1870, y: 340, w: 20, h: 20 },
      { x: 2010, y: 260, w: 20, h: 20 },
      { x: 2160, y: 180, w: 20, h: 20 },
      { x: 2310, y: 260, w: 20, h: 20 },
      { x: 2450, y: 340, w: 20, h: 20 },
      { x: 2590, y: 420, w: 20, h: 20 },
      { x: 2800, y: 460, w: 20, h: 20 },
      { x: 3130, y: 400, w: 20, h: 20 },
      { x: 3270, y: 320, w: 20, h: 20 },
      { x: 3410, y: 240, w: 20, h: 20 },
      { x: 3560, y: 160, w: 20, h: 20 },
      { x: 3710, y: 240, w: 20, h: 20 },
      { x: 3850, y: 320, w: 20, h: 20 },
      { x: 3990, y: 400, w: 20, h: 20 }
    ],
    enemies: [
      { kind: 'beetle', x: 1450, y: groundY - 32, w: 36, h: 32, patrolMin: 1380, patrolMax: 1600 },
      { kind: 'bat', x: 1000, y: 160, w: 36, h: 28, patrolMin: 850, patrolMax: 1200 },
      { kind: 'bat', x: 2150, y: 140, w: 36, h: 28, patrolMin: 2000, patrolMax: 2350 },
      { kind: 'beetle', x: 2780, y: groundY - 32, w: 36, h: 32, patrolMin: 2700, patrolMax: 2980 },
      { kind: 'bat', x: 3550, y: 120, w: 36, h: 28, patrolMin: 3400, patrolMax: 3700 },
      { kind: 'bat', x: 4400, y: 200, w: 36, h: 28, patrolMin: 4200, patrolMax: 4700 },
      { kind: 'beetle', x: 4250, y: groundY - 32, w: 36, h: 32, patrolMin: 4100, patrolMax: 4600 }
    ],
    powerUps: [
      { kind: 'doubleJump', x: 940, y: 200, w: 24, h: 24 },
      { kind: 'extraLife', x: 2120, y: 180, w: 24, h: 24 },
      { kind: 'shield', x: 3520, y: 160, w: 24, h: 24 }
    ],
    goal: { x: 4750, y: 380, w: 150, h: 24, isGoal: true }
  }
];

export const getLevel = (id: number): LevelData | undefined => levels.find((l) => l.id === id);
