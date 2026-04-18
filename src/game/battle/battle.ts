import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import type { Enemy, GameState, InputKeys } from '../types';
import { audio } from '../audio';
import { BATTLE_ARENA, BATTLE_PLAYER, BATTLE_STATS } from './battleConfig';
import type { BattleParticle, BattleState } from './battleTypes';

const INTRO_FRAMES = 70;
const OUTCOME_FRAMES = 90;

export const initBattle = (enemy: Enemy, worldEnemyIndex: number): BattleState => {
  const stats = BATTLE_STATS[enemy.kind];
  const baseScale = enemy.kind === 'rocco' ? 6 : enemy.kind === 'dog' ? 5 : 4;
  return {
    screen: 'intro',
    frame: 0,
    player: {
      x: GAME_WIDTH / 2,
      baseX: GAME_WIDTH / 2,
      y: BATTLE_ARENA.playerY,
      baseY: BATTLE_ARENA.playerY,
      scale: BATTLE_PLAYER.playerScale,
      baseScale: BATTLE_PLAYER.playerScale,
      state: 'idle',
      animTimer: 0,
      invuln: 0,
      speed: BATTLE_PLAYER.baseSpeed
    },
    enemy: {
      kind: enemy.kind,
      x: BATTLE_ARENA.enemyIdleX,
      baseX: BATTLE_ARENA.enemyIdleX,
      y: BATTLE_ARENA.enemyY,
      baseY: BATTLE_ARENA.enemyY,
      scale: baseScale,
      baseScale,
      hp: stats.hp,
      maxHp: stats.hp,
      state: 'idle',
      timer: 0,
      startX: BATTLE_ARENA.enemyIdleX,
      targetX: BATTLE_ARENA.enemyIdleX,
      invuln: 0,
      damage: stats.damage,
      attackInterval: stats.attackInterval,
      telegraphFrames: stats.telegraphFrames,
      lungeFrames: stats.lungeFrames
    },
    worldEnemyIndex,
    particles: [],
    screenShake: 0,
    introTimer: INTRO_FRAMES,
    outcomeTimer: 0,
    attackPressedPrev: false
  };
};

const spawnBattleParticles = (battle: BattleState, x: number, y: number, color: string, count = 14) => {
  for (let i = 0; i < count; i++) {
    battle.particles.push({
      x: x + (Math.random() - 0.5) * 40,
      y: y - Math.random() * 30,
      vx: (Math.random() - 0.5) * 9,
      vy: (Math.random() - 1) * 9,
      life: 24 + Math.random() * 8,
      maxLife: 32,
      color,
      size: 4
    });
  }
};

const easeInOut = (p: number) => p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;

/**
 * Finaliza la batalla y devuelve control al modo plataforma.
 * - won:  marca al enemigo como derrotado, suma score, invuln de gracia.
 * - lost: descuenta vida. Si quedan 0, game over.
 */
const closeBattle = (state: GameState, result: 'won' | 'lost') => {
  const battle = state.battle;
  if (!battle) return;
  const worldEnemy = state.enemies[battle.worldEnemyIndex];
  if (result === 'won' && worldEnemy) {
    worldEnemy.alive = false;
    if (worldEnemy.awakeTimer !== undefined) worldEnemy.awakeTimer = 0;
    if (worldEnemy.alertTimer !== undefined) worldEnemy.alertTimer = 0;
    const bonus = worldEnemy.kind === 'rocco' ? 200 : worldEnemy.kind === 'dog' ? 100 : 60;
    state.score += bonus;
    audio.play('win');
  } else if (result === 'lost') {
    state.player.lives -= battle.enemy.damage;
    if (state.player.lives < 0) state.player.lives = 0;
    audio.play('death');
    // Reposiciona al player a la izquierda del enemigo para evitar retrigger
    if (worldEnemy) {
      state.player.x = worldEnemy.x - 180;
      state.player.vx = 0;
      state.player.vy = 0;
    }
  }
  state.player.invulnerableFrames = 90;
  state.battle = undefined;
  state.screen = state.player.lives <= 0 ? 'lost' : 'playing';
};

export const updateBattle = (state: GameState, keys: InputKeys) => {
  if (state.screen !== 'battle' || !state.battle) return;
  const battle = state.battle;
  battle.frame++;

  // Intro: pausa con el título 70 frames
  if (battle.screen === 'intro') {
    battle.introTimer--;
    if (battle.introTimer <= 0) {
      battle.screen = 'fighting';
    }
    return;
  }

  // Outcome: pausa con resultado 90 frames, luego cierra
  if (battle.screen === 'won' || battle.screen === 'lost') {
    battle.outcomeTimer--;
    updateBattleParticles(battle);
    if (battle.outcomeTimer <= 0) {
      closeBattle(state, battle.screen);
    }
    return;
  }

  // --- FIGHTING ---
  const { player, enemy } = battle;

  if (player.invuln > 0) player.invuln--;
  if (enemy.invuln > 0) enemy.invuln--;
  if (battle.screenShake > 0) battle.screenShake--;

  // Player movement + attack input
  const attackPressed = !!(keys.ArrowUp || keys.Space);
  const attackJustPressed = attackPressed && !battle.attackPressedPrev;
  battle.attackPressedPrev = attackPressed;

  if (player.state === 'idle') {
    if (keys.ArrowLeft) player.x -= player.speed;
    if (keys.ArrowRight) player.x += player.speed;
    if (player.x < BATTLE_ARENA.playerMinX) player.x = BATTLE_ARENA.playerMinX;
    if (player.x > BATTLE_ARENA.playerMaxX) player.x = BATTLE_ARENA.playerMaxX;

    if (attackJustPressed) {
      player.state = 'attacking';
      player.animTimer = 0;
      audio.play('jump'); // reutilizado como swoosh de zarpazo
    }
  } else if (player.state === 'attacking') {
    player.animTimer++;
    const total = BATTLE_PLAYER.attackAnimFrames;
    const p = player.animTimer / total;
    // Lunge: primera mitad acerca al enemigo, segunda regresa
    if (p <= 0.5) {
      const k = easeInOut(p * 2);
      player.scale = player.baseScale - (player.baseScale - 4) * k;
      player.y = player.baseY - (player.baseY - (GAME_HEIGHT / 2 + 60)) * k;
    } else {
      const k = easeInOut((p - 0.5) * 2);
      player.scale = 4 + (player.baseScale - 4) * k;
      player.y = (GAME_HEIGHT / 2 + 60) + (player.baseY - (GAME_HEIGHT / 2 + 60)) * k;
    }
    // Frame exacto de impacto
    if (player.animTimer === BATTLE_PLAYER.attackImpactFrame && enemy.invuln === 0 && enemy.state !== 'defeated') {
      const aligned = Math.abs(player.x - enemy.x) < BATTLE_PLAYER.hitReach;
      if (aligned) {
        enemy.hp -= 1;
        enemy.invuln = BATTLE_PLAYER.hitEnemyInvulnFrames;
        battle.screenShake = 6;
        spawnBattleParticles(battle, enemy.x, enemy.y - 40, '#ffcc00');
        audio.play('hit');
        if (enemy.hp <= 0) {
          enemy.state = 'defeated';
          battle.screen = 'won';
          battle.outcomeTimer = OUTCOME_FRAMES;
          return;
        }
      } else {
        // Whiff visual (sin penalización en F1, solo partículas blancas)
        spawnBattleParticles(battle, player.x, player.y - 80, '#ffffff', 6);
      }
    }
    if (player.animTimer >= total) {
      player.state = 'idle';
      player.scale = player.baseScale;
      player.y = player.baseY;
    }
  }

  // Enemy AI
  if (enemy.state === 'idle') {
    // Persigue lentamente al player
    enemy.x += (player.x - enemy.x) * 0.025;
    enemy.timer++;
    if (enemy.timer > enemy.attackInterval) {
      enemy.state = 'telegraph';
      enemy.timer = 0;
      enemy.startX = enemy.x;
      enemy.targetX = player.x;
    }
  } else if (enemy.state === 'telegraph') {
    enemy.timer++;
    enemy.x = enemy.startX + (Math.random() - 0.5) * 12;
    if (enemy.timer > enemy.telegraphFrames) {
      enemy.state = 'attack';
      enemy.timer = 0;
      enemy.startX = enemy.x;
    }
  } else if (enemy.state === 'attack') {
    enemy.timer++;
    const total = enemy.lungeFrames;
    const p = enemy.timer / total;
    if (p <= 0.5) {
      const k = easeInOut(p * 2);
      enemy.scale = enemy.baseScale + (14 - enemy.baseScale) * k;
      enemy.y = enemy.baseY + ((GAME_HEIGHT - 60) - enemy.baseY) * k;
      enemy.x = enemy.startX + (enemy.targetX - enemy.startX) * k;
    } else {
      const k = easeInOut((p - 0.5) * 2);
      enemy.scale = 14 - (14 - enemy.baseScale) * k;
      enemy.y = (GAME_HEIGHT - 60) - ((GAME_HEIGHT - 60) - enemy.baseY) * k;
      enemy.x = enemy.targetX - (enemy.targetX - enemy.startX) * k;
    }
    const impactFrame = Math.floor(total / 2);
    if (enemy.timer === impactFrame && player.invuln === 0) {
      const aligned = Math.abs(player.x - enemy.x) < 130;
      if (aligned) {
        battle.screenShake = 14;
        spawnBattleParticles(battle, player.x, player.y - 50, '#ff4d6d');
        audio.play('hit');
        player.invuln = BATTLE_PLAYER.hurtInvulnFrames;
        // En Fase 1 cada impacto = 1 daño de batalla; 5 impactos = derrota.
        const battleHp = Math.max(0, 5 - Math.floor(player.invuln === BATTLE_PLAYER.hurtInvulnFrames ? 0 : 0));
        void battleHp;
        // Usamos un contador local: restamos a una hp implícita del battle.
        (player as any)._hits = ((player as any)._hits ?? 0) + 1;
        if ((player as any)._hits >= 5) {
          battle.screen = 'lost';
          battle.outcomeTimer = OUTCOME_FRAMES;
          return;
        }
      }
    }
    if (enemy.timer >= total) {
      enemy.state = 'idle';
      enemy.timer = 0;
      enemy.scale = enemy.baseScale;
      enemy.y = enemy.baseY;
    }
  }

  updateBattleParticles(battle);
};

const updateBattleParticles = (battle: BattleState) => {
  for (let i = battle.particles.length - 1; i >= 0; i--) {
    const p: BattleParticle = battle.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.55;
    p.life--;
    if (p.life <= 0) battle.particles.splice(i, 1);
  }
};

// HP local de Anubis durante la batalla (convertido a corazones visuales)
export const getBattlePlayerHits = (battle: BattleState): number => {
  return (battle.player as any)._hits ?? 0;
};

export const BATTLE_PLAYER_MAX_HITS = 5;
