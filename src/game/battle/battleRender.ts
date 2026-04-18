import { GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { drawSprite } from '../sprites';
import type { GameState } from '../types';
import {
  anubisBack, anubisBackAttack, anubisBackPalette,
  dogFront, dogFrontPalette,
  roccoFront, roccoFrontPalette,
  streetCatFront, streetCatFrontPalette
} from './battleSprites';
import { BATTLE_PLAYER_MAX_HITS, getBattlePlayerHits } from './battle';

const drawArena = (ctx: CanvasRenderingContext2D, frame: number) => {
  // Cielo nocturno
  const horizon = GAME_HEIGHT / 2 - 20;
  const bgGrad = ctx.createLinearGradient(0, 0, 0, horizon);
  bgGrad.addColorStop(0, '#100b21');
  bgGrad.addColorStop(1, '#3b2f52');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, GAME_WIDTH, horizon);

  // Estrellas titilantes
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 28; i++) {
    const x = (i * 137) % GAME_WIDTH;
    const y = (i * 83) % horizon;
    const tw = (Math.sin(frame * 0.06 + i) + 1) / 2;
    ctx.globalAlpha = 0.3 + tw * 0.6;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;

  // Suelo con líneas de fuga (perspectiva tejado)
  ctx.fillStyle = '#1e2433';
  ctx.fillRect(0, horizon, GAME_WIDTH, GAME_HEIGHT - horizon);

  ctx.strokeStyle = '#111520';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = -8; i <= 8; i++) {
    const startX = GAME_WIDTH / 2 + i * 30;
    const endX = GAME_WIDTH / 2 + i * 150;
    ctx.moveTo(startX, horizon);
    ctx.lineTo(endX, GAME_HEIGHT);
  }
  for (let i = 1; i <= 8; i++) {
    const y = horizon + Math.pow(i, 1.4) * 12;
    ctx.moveTo(0, y);
    ctx.lineTo(GAME_WIDTH, y);
  }
  ctx.stroke();
};

const drawShadow = (ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) => {
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, scale * 5, scale * 1.8, 0, 0, Math.PI * 2);
  ctx.fill();
};

const getEnemySprite = (kind: string) => {
  if (kind === 'rocco') return { matrix: roccoFront, palette: roccoFrontPalette };
  if (kind === 'dog') return { matrix: dogFront, palette: dogFrontPalette };
  return { matrix: streetCatFront, palette: streetCatFrontPalette };
};

const drawPixelBar = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  pct: number, fillColor: string, emptyColor = '#2b1f33'
) => {
  ctx.fillStyle = '#000';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = emptyColor;
  ctx.fillRect(x, y, w, h);
  const fillW = Math.max(0, Math.min(w, w * pct));
  ctx.fillStyle = fillColor;
  ctx.fillRect(x, y, fillW, h);
};

const drawHud = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const battle = state.battle!;
  const hits = getBattlePlayerHits(battle);
  const hp = BATTLE_PLAYER_MAX_HITS - hits;

  // Anubis — corazones arriba izquierda
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = '#000';
  ctx.fillText('ANUBIS', 22, 36);
  ctx.fillStyle = '#ffb6d9';
  ctx.fillText('ANUBIS', 20, 34);
  for (let i = 0; i < BATTLE_PLAYER_MAX_HITS; i++) {
    const x = 20 + i * 28;
    const y = 44;
    const filled = i < hp;
    ctx.fillStyle = filled ? '#ff4d6d' : 'rgba(255,77,109,0.15)';
    ctx.beginPath();
    ctx.arc(x + 10, y + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Enemigo — barra arriba derecha
  const enemyLabel = battle.enemy.kind === 'rocco'
    ? 'ROCCO'
    : battle.enemy.kind === 'dog' ? 'PERRO' : battle.enemy.kind === 'streetCat' ? 'GATO' : battle.enemy.kind.toUpperCase();
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = '#000';
  ctx.textAlign = 'right';
  ctx.fillText(enemyLabel, GAME_WIDTH - 20, 36);
  ctx.fillStyle = '#ffcc80';
  ctx.fillText(enemyLabel, GAME_WIDTH - 22, 34);
  ctx.textAlign = 'left';
  const pct = battle.enemy.hp / battle.enemy.maxHp;
  drawPixelBar(ctx, GAME_WIDTH - 220, 44, 200, 16, pct, '#ff8a3d');
};

const drawBanner = (
  ctx: CanvasRenderingContext2D,
  title: string, subtitle: string,
  titleColor = '#ffe066', subColor = '#ffffff'
) => {
  const boxW = 520;
  const boxH = 160;
  const x = (GAME_WIDTH - boxW) / 2;
  const y = (GAME_HEIGHT - boxH) / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(x, y, boxW, boxH);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, boxW, boxH);
  ctx.font = "20px 'Press Start 2P', monospace";
  ctx.fillStyle = titleColor;
  ctx.textAlign = 'center';
  ctx.fillText(title, GAME_WIDTH / 2, y + 60);
  ctx.font = "10px 'Press Start 2P', monospace";
  ctx.fillStyle = subColor;
  ctx.fillText(subtitle, GAME_WIDTH / 2, y + 100);
  ctx.textAlign = 'left';
};

export const renderBattle = (ctx: CanvasRenderingContext2D, state: GameState) => {
  if (!state.battle) return;
  const battle = state.battle;

  ctx.save();
  if (battle.screenShake > 0) {
    ctx.translate((Math.random() - 0.5) * 12, (Math.random() - 0.5) * 12);
  }

  drawArena(ctx, battle.frame);

  // Orden por profundidad: el que esté más arriba en Y se dibuja primero
  const entities = [
    { kind: 'enemy' as const, y: battle.enemy.y },
    { kind: 'player' as const, y: battle.player.y }
  ].sort((a, b) => a.y - b.y);

  for (const e of entities) {
    if (e.kind === 'enemy') {
      const en = battle.enemy;
      const flashInvuln = en.invuln > 0 && Math.floor(battle.frame / 4) % 2 === 0;
      const flashTelegraph = en.state === 'telegraph' && Math.floor(battle.frame / 6) % 2 === 0;
      drawShadow(ctx, en.x, en.y + 4, en.scale);
      if (!flashInvuln) {
        const sp = getEnemySprite(en.kind);
        const matrixW = sp.matrix[0].length * en.scale;
        const matrixH = sp.matrix.length * en.scale;
        const alpha = flashTelegraph ? 0.6 : 1;
        drawSprite(ctx, sp.matrix, sp.palette, en.x - matrixW / 2, en.y - matrixH, en.scale, false, alpha);
      }
    } else {
      const p = battle.player;
      const flash = p.invuln > 0 && Math.floor(battle.frame / 4) % 2 === 0;
      drawShadow(ctx, p.x, p.y + 4, p.scale);
      if (!flash) {
        const sprite = p.state === 'attacking' ? anubisBackAttack : anubisBack;
        const w = sprite[0].length * p.scale;
        const h = sprite.length * p.scale;
        drawSprite(ctx, sprite, anubisBackPalette, p.x - w / 2, p.y - h, p.scale, false);
        // Zarpazo visual durante frames 6-10
        if (p.state === 'attacking' && p.animTimer >= 6 && p.animTimer <= 10) {
          ctx.fillStyle = 'rgba(255,255,255,0.85)';
          ctx.fillRect(p.x - 28, p.y - p.scale * 8, 8, 36);
          ctx.fillRect(p.x - 2, p.y - p.scale * 9, 8, 44);
          ctx.fillRect(p.x + 24, p.y - p.scale * 8, 8, 36);
        }
      }
    }
  }

  // Partículas
  for (const pt of battle.particles) {
    ctx.globalAlpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  ctx.restore();

  // HUD se dibuja SIN screen shake
  drawHud(ctx, state);

  // Banner de intro / outcome
  if (battle.screen === 'intro') {
    const label = battle.enemy.kind === 'rocco' ? 'ROCCO'
      : battle.enemy.kind === 'dog' ? 'UN PERRO'
      : battle.enemy.kind === 'streetCat' ? 'UN GATO CALLEJERO'
      : 'UN ENEMIGO';
    drawBanner(ctx, `¡${label} APARECIÓ!`, 'Muévete para esquivar · Toca A para golpear', '#ffe066');
  } else if (battle.screen === 'won') {
    drawBanner(ctx, '¡ANUBIS GANA!', 'Zarpazo certero. Rocco se rinde.', '#7aff80');
  } else if (battle.screen === 'lost') {
    drawBanner(ctx, '¡ROCCO TE ATRAPÓ!', 'Perdiste una vida. Vuelves al tejado.', '#ff4d6d');
  }
};
