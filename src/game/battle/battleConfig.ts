import type { EnemyKind } from '../types';

export interface BattleEnemyStats {
  hp: number;
  damage: number;          // vidas que quita al jugador
  attackInterval: number;  // frames entre ataques
  telegraphFrames: number; // frames de aviso antes del lunge
  lungeFrames: number;     // frames totales del ataque (lunge + retorno)
}

// Stats por tipo de enemigo. En Fase 1 solo rocco se usa en práctica,
// pero dejamos los otros listos para activarlos desde engine en F3.
export const BATTLE_STATS: Record<EnemyKind, BattleEnemyStats> = {
  bat:       { hp: 3,  damage: 1, attackInterval: 70,  telegraphFrames: 25, lungeFrames: 24 },
  beetle:    { hp: 3,  damage: 1, attackInterval: 80,  telegraphFrames: 28, lungeFrames: 26 },
  streetCat: { hp: 6,  damage: 1, attackInterval: 80,  telegraphFrames: 28, lungeFrames: 28 },
  dog:       { hp: 10, damage: 1, attackInterval: 60,  telegraphFrames: 22, lungeFrames: 26 },
  rocco:     { hp: 15, damage: 2, attackInterval: 90,  telegraphFrames: 30, lungeFrames: 30 }
};

export const BATTLE_PLAYER = {
  baseSpeed: 7,          // velocidad lateral durante batalla
  playerScale: 6,        // escala del sprite anubis de espaldas (9 cols * 6 = 54 px)
  attackAnimFrames: 15,  // duración de la animación de tap
  attackImpactFrame: 8,  // frame exacto donde se calcula hit
  hitReach: 120,         // |player.x - enemy.x| debe ser menor para acertar
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
