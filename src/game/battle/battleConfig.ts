import type { EnemyKind } from '../types';

export interface BattleEnemyStats {
  hp: number;
  damage: number;          // vidas que quita al jugador
  attackInterval: number;  // frames entre ataques
  telegraphFrames: number; // frames de aviso antes del lunge
  lungeFrames: number;     // frames totales del ataque (lunge + retorno)
}

export const BATTLE_STATS: Record<EnemyKind, BattleEnemyStats> = {
  bat:       { hp: 3,  damage: 1, attackInterval: 70,  telegraphFrames: 25, lungeFrames: 24 },
  beetle:    { hp: 3,  damage: 1, attackInterval: 80,  telegraphFrames: 28, lungeFrames: 26 },
  streetCat: { hp: 6,  damage: 1, attackInterval: 80,  telegraphFrames: 28, lungeFrames: 28 },
  dog:       { hp: 10, damage: 1, attackInterval: 60,  telegraphFrames: 22, lungeFrames: 26 },
  rocco:     { hp: 15, damage: 2, attackInterval: 90,  telegraphFrames: 30, lungeFrames: 30 }
};

export const BATTLE_PLAYER = {
  baseSpeed: 7,
  playerScale: 6,
  attackAnimFrames: 15,
  attackImpactFrame: 8,
  hitReach: 120,          // rango |player.x - enemy.x| para que un tap impacte
  hurtInvulnFrames: 45,
  hitEnemyInvulnFrames: 18
};

export const BATTLE_ARENA = {
  playerY: 540,          // apoyado cerca del borde inferior
  enemyY: 330,           // posición idle del enemigo arriba
  playerMinX: 120,
  playerMaxX: 680,
  enemyIdleX: 400        // centro horizontal
};
