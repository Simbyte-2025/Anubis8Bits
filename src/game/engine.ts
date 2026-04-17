import { COLORS, GAME_HEIGHT, GAME_WIDTH, PHYSICS, PLAYER } from './constants';
import { getLevel } from './levels';
import {
  batPalette, batSprite1, batSprite2,
  beetlePalette, beetleSprite1, beetleSprite2,
  catPalette, catSpriteJump, catSpriteRun1, catSpriteRun2, catSpriteSit,
  drawSprite, heartPalette, heartSprite
} from './sprites';
import type { GameState, InputKeys, Particle, Player } from './types';
import { audio } from './audio';

const aabb = (a: { x: number; y: number; w?: number; h?: number; width?: number; height?: number }, b: { x: number; y: number; w: number; h: number }) => {
  const aw = (a as any).w ?? (a as any).width;
  const ah = (a as any).h ?? (a as any).height;
  return a.x < b.x + b.w && a.x + aw > b.x && a.y < b.y + b.h && a.y + ah > b.y;
};

export const createInitialState = (): GameState => ({
  screen: 'menu',
  currentLevelId: 1,
  cameraX: 0,
  score: 0,
  totalScore: 0,
  frameCount: 0,
  player: createPlayer(50, 500 - PLAYER.height),
  platforms: [],
  coins: [],
  enemies: [],
  powerUps: [],
  particles: [],
  goal: null,
  cameraMaxX: GAME_WIDTH,
  theme: 'day'
});

const createPlayer = (x: number, y: number): Player => ({
  x, y,
  width: PLAYER.width,
  height: PLAYER.height,
  vx: 0,
  vy: 0,
  isGrounded: true,
  facingRight: true,
  scale: PLAYER.scale,
  animFrame: 0,
  lives: PLAYER.startLives,
  invulnerableFrames: 0,
  coyoteFrames: 0,
  jumpBufferFrames: 0,
  hasDoubleJump: false,
  doubleJumpUsed: false,
  hasShield: false,
  shieldFrames: 0,
  spawnX: x,
  spawnY: y
});

export const loadLevel = (state: GameState, levelId: number, keepLives: boolean) => {
  const level = getLevel(levelId);
  if (!level) return;
  const previousLives = keepLives ? state.player.lives : PLAYER.startLives;
  state.currentLevelId = levelId;
  state.theme = level.theme;
  state.cameraMaxX = level.cameraMaxX;
  state.cameraX = 0;
  state.score = 0;
  state.frameCount = 0;
  state.platforms = level.platforms.map((p) => ({ ...p }));
  state.coins = level.coins.map((c) => ({ ...c, collected: false }));
  state.enemies = level.enemies.map((e) => ({
    ...e,
    vx: e.kind === 'beetle' ? 1.4 : 1.8,
    vy: 0,
    baseY: e.y,
    alive: true,
    animFrame: 0
  }));
  state.powerUps = level.powerUps.map((p) => ({ ...p, collected: false }));
  state.particles = [];
  state.goal = { ...level.goal };
  state.player = createPlayer(level.player.x, level.player.y);
  state.player.lives = previousLives;
  state.screen = 'playing';
};

const spawnParticles = (state: GameState, x: number, y: number, count: number, color: string, speed = 3) => {
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const sp = speed * (0.6 + Math.random() * 0.6);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * sp,
      vy: Math.sin(angle) * sp - 1,
      life: 30, maxLife: 30,
      color, size: 3
    });
  }
};

const tryJump = (player: Player) => {
  const canJump = player.isGrounded || player.coyoteFrames > 0;
  if (canJump) {
    player.vy = PHYSICS.jumpPower;
    player.isGrounded = false;
    player.coyoteFrames = 0;
    player.jumpBufferFrames = 0;
    player.doubleJumpUsed = false;
    audio.play('jump');
    return true;
  }
  if (player.hasDoubleJump && !player.doubleJumpUsed) {
    player.vy = PHYSICS.doubleJumpPower;
    player.doubleJumpUsed = true;
    player.jumpBufferFrames = 0;
    audio.play('doubleJump');
    return true;
  }
  return false;
};

const damagePlayer = (state: GameState, hazardX: number) => {
  const player = state.player;
  if (player.invulnerableFrames > 0) return;
  if (player.hasShield) {
    player.hasShield = false;
    player.shieldFrames = 0;
    player.invulnerableFrames = 30;
    audio.play('hit');
    spawnParticles(state, player.x + player.width / 2, player.y + player.height / 2, 12, COLORS.shield, 4);
    return;
  }
  player.lives -= 1;
  player.invulnerableFrames = PLAYER.invulnerabilityFrames;
  player.vx = hazardX < player.x ? PLAYER.knockbackX : -PLAYER.knockbackX;
  player.vy = PLAYER.knockbackY;
  player.isGrounded = false;
  audio.play('hit');
  spawnParticles(state, player.x + player.width / 2, player.y + player.height / 2, 10, COLORS.heart, 4);
  if (player.lives <= 0) {
    state.screen = 'lost';
    audio.play('death');
  }
};

export const update = (state: GameState, keys: InputKeys, onScoreChange: () => void, onWin: () => void) => {
  if (state.screen !== 'playing') return;
  state.frameCount++;
  const player = state.player;

  if (keys.ArrowLeft) {
    player.vx = -PHYSICS.playerSpeed;
    player.facingRight = false;
    if (state.frameCount % 6 === 0) player.animFrame = (player.animFrame + 1) % 2;
  } else if (keys.ArrowRight) {
    player.vx = PHYSICS.playerSpeed;
    player.facingRight = true;
    if (state.frameCount % 6 === 0) player.animFrame = (player.animFrame + 1) % 2;
  } else {
    player.vx *= player.isGrounded ? PHYSICS.groundFriction : PHYSICS.airFriction;
    if (Math.abs(player.vx) < 0.1) player.vx = 0;
    if (player.isGrounded) player.animFrame = 0;
  }

  if (keys.ArrowUp || keys.Space) {
    player.jumpBufferFrames = PHYSICS.jumpBufferFrames;
    keys.ArrowUp = false;
    keys.Space = false;
  }
  if (player.jumpBufferFrames > 0) {
    if (tryJump(player)) {
      // jumped
    }
    player.jumpBufferFrames--;
  }

  player.vy += PHYSICS.gravity;
  if (player.vy > PHYSICS.maxFallSpeed) player.vy = PHYSICS.maxFallSpeed;

  let nextX = player.x + player.vx;
  let nextY = player.y + player.vy;
  const wasGrounded = player.isGrounded;
  player.isGrounded = false;

  for (const p of state.platforms) {
    if (nextX < p.x + p.w && nextX + player.width > p.x &&
        nextY < p.y + p.h && nextY + player.height > p.y) {
      if (player.vy > 0 && player.y + player.height <= p.y) {
        player.y = p.y - player.height;
        player.vy = 0;
        player.isGrounded = true;
        player.doubleJumpUsed = false;
        nextY = player.y;
        if (!wasGrounded) audio.play('land');
      } else if (player.vy < 0 && player.y >= p.y + p.h) {
        player.y = p.y + p.h;
        player.vy = 0;
        nextY = player.y;
      } else if (player.vx > 0 && player.x + player.width <= p.x) {
        player.x = p.x - player.width;
        player.vx = 0;
        nextX = player.x;
      } else if (player.vx < 0 && player.x >= p.x + p.w) {
        player.x = p.x + p.w;
        player.vx = 0;
        nextX = player.x;
      }
    }
  }

  player.x = nextX;
  player.y = nextY;

  if (player.isGrounded) player.coyoteFrames = PHYSICS.coyoteTimeFrames;
  else if (player.coyoteFrames > 0) player.coyoteFrames--;

  if (player.invulnerableFrames > 0) player.invulnerableFrames--;
  if (player.hasShield) {
    player.shieldFrames++;
    if (player.shieldFrames > 600) player.hasShield = false;
  }

  if (state.goal && aabb(player, state.goal)) {
    state.screen = 'won';
    audio.play('win');
    onWin();
  }

  let scoreChanged = false;
  for (const c of state.coins) {
    if (!c.collected && aabb(player, c)) {
      c.collected = true;
      state.score += 10;
      scoreChanged = true;
      audio.play('coin');
      spawnParticles(state, c.x + c.w / 2, c.y + c.h / 2, 6, COLORS.coin, 2);
    }
  }
  for (const pu of state.powerUps) {
    if (!pu.collected && aabb(player, pu)) {
      pu.collected = true;
      audio.play('powerup');
      if (pu.kind === 'doubleJump') {
        player.hasDoubleJump = true;
        spawnParticles(state, pu.x + pu.w / 2, pu.y + pu.h / 2, 10, COLORS.doubleJump, 3);
      } else if (pu.kind === 'shield') {
        player.hasShield = true;
        player.shieldFrames = 0;
        spawnParticles(state, pu.x + pu.w / 2, pu.y + pu.h / 2, 10, COLORS.shield, 3);
      } else if (pu.kind === 'extraLife') {
        player.lives++;
        spawnParticles(state, pu.x + pu.w / 2, pu.y + pu.h / 2, 12, COLORS.heart, 3);
      }
      scoreChanged = true;
    }
  }
  if (scoreChanged) onScoreChange();

  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e.kind === 'beetle') {
      e.x += e.vx;
      if (e.x < e.patrolMin) { e.x = e.patrolMin; e.vx = Math.abs(e.vx); }
      if (e.x + e.w > e.patrolMax) { e.x = e.patrolMax - e.w; e.vx = -Math.abs(e.vx); }
      if (state.frameCount % 10 === 0) e.animFrame = (e.animFrame + 1) % 2;
    } else {
      e.x += e.vx;
      e.y = e.baseY + Math.sin(state.frameCount * 0.05 + e.patrolMin * 0.01) * 30;
      if (e.x < e.patrolMin) { e.x = e.patrolMin; e.vx = Math.abs(e.vx); }
      if (e.x + e.w > e.patrolMax) { e.x = e.patrolMax - e.w; e.vx = -Math.abs(e.vx); }
      if (state.frameCount % 6 === 0) e.animFrame = (e.animFrame + 1) % 2;
    }
    if (aabb(player, e)) {
      const stomping = player.vy > 0 && player.y + player.height - 12 < e.y;
      if (stomping) {
        e.alive = false;
        player.vy = -10;
        player.doubleJumpUsed = false;
        state.score += 25;
        scoreChanged = true;
        audio.play('hit');
        spawnParticles(state, e.x + e.w / 2, e.y + e.h / 2, 8, '#fff', 2);
        onScoreChange();
      } else {
        damagePlayer(state, e.x);
      }
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const pt = state.particles[i];
    pt.x += pt.vx;
    pt.y += pt.vy;
    pt.vy += 0.2;
    pt.life--;
    if (pt.life <= 0) state.particles.splice(i, 1);
  }

  if (player.y > GAME_HEIGHT + 100) {
    if (player.lives > 1) {
      player.lives--;
      player.invulnerableFrames = PLAYER.invulnerabilityFrames;
      player.x = player.spawnX;
      player.y = player.spawnY;
      player.vx = 0;
      player.vy = 0;
      audio.play('hit');
    } else {
      player.lives = 0;
      state.screen = 'lost';
      audio.play('death');
    }
  }

  const cameraMargin = 300;
  if (player.x > state.cameraX + GAME_WIDTH - cameraMargin) {
    state.cameraX = player.x - GAME_WIDTH + cameraMargin;
  } else if (player.x < state.cameraX + cameraMargin && state.cameraX > 0) {
    state.cameraX = player.x - cameraMargin;
  }
  if (state.cameraX < 0) state.cameraX = 0;
  const camMax = state.cameraMaxX - GAME_WIDTH;
  if (state.cameraX > camMax) state.cameraX = camMax;
};

const drawParallaxBackground = (ctx: CanvasRenderingContext2D, state: GameState) => {
  const theme = state.theme;
  if (theme === 'day') {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#FFB6C1');
    grad.addColorStop(1, '#FFD9DD');
    ctx.fillStyle = grad;
  } else if (theme === 'night') {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#1f2540');
    grad.addColorStop(1, '#3a2a4a');
    ctx.fillStyle = grad;
  } else {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#f4a460');
    grad.addColorStop(1, '#ffe4b5');
    ctx.fillStyle = grad;
  }
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  if (theme === 'night') {
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 50; i++) {
      const x = (i * 173 - state.cameraX * 0.1) % GAME_WIDTH;
      const xx = x < 0 ? x + GAME_WIDTH : x;
      const y = (i * 71) % (GAME_HEIGHT / 2);
      const tw = (Math.sin(state.frameCount * 0.05 + i) + 1) / 2;
      ctx.globalAlpha = 0.4 + tw * 0.6;
      ctx.fillRect(xx, y, 2, 2);
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 100, 100, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  const farColor = theme === 'desert' ? '#d2691e' : (theme === 'night' ? '#28304a' : '#cfb0c0');
  ctx.fillStyle = farColor;
  for (let i = -1; i < 12; i++) {
    const baseX = i * 260 - (state.cameraX * 0.3) % 260;
    ctx.beginPath();
    ctx.moveTo(baseX, 400);
    ctx.lineTo(baseX + 130, 240);
    ctx.lineTo(baseX + 260, 400);
    ctx.closePath();
    ctx.fill();
  }

  if (theme !== 'desert') {
    ctx.fillStyle = theme === 'night' ? 'rgba(180,180,210,0.4)' : 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 12; i++) {
      const x = (i * 320 - state.cameraX * 0.5) % (GAME_WIDTH * 2);
      const xx = x < -100 ? x + GAME_WIDTH * 2 : x;
      ctx.fillRect(xx, 80 + (i % 3) * 30, 80, 24);
      ctx.fillRect(xx + 30, 70 + (i % 3) * 30, 60, 40);
    }
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 120, 110, 50, 0, Math.PI * 2);
    ctx.fill();
  }
};

export const render = (ctx: CanvasRenderingContext2D, state: GameState) => {
  drawParallaxBackground(ctx, state);

  ctx.save();
  ctx.translate(-state.cameraX, 0);

  for (const p of state.platforms) {
    const isHazard = p.isHazard;
    ctx.fillStyle = isHazard ? COLORS.spike : (state.theme === 'night' ? COLORS.groundNight : (state.theme === 'desert' ? '#deb887' : COLORS.ground));
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = state.theme === 'night' ? COLORS.dirtNight : (state.theme === 'desert' ? '#a0522d' : COLORS.dirt);
    ctx.fillRect(p.x, p.y + 10, p.w, p.h - 10);
  }

  if (state.goal) {
    const g = state.goal;
    ctx.fillStyle = COLORS.goal;
    ctx.fillRect(g.x, g.y, g.w, g.h);
    ctx.fillStyle = COLORS.goalDark;
    ctx.fillRect(g.x, g.y + 8, g.w, g.h - 8);
    ctx.fillStyle = '#FFF';
    ctx.font = "20px 'Press Start 2P', monospace";
    const bob = Math.sin(state.frameCount * 0.08) * 3;
    ctx.fillText('OPA', g.x + g.w / 2 - 38, g.y - 24 + bob);
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 3; i++) {
      const fx = g.x + 30 + i * 40;
      const fy = g.y - 50 + Math.sin(state.frameCount * 0.1 + i) * 4;
      ctx.fillRect(fx, fy, 8, 24);
      ctx.fillRect(fx - 4, fy + 4, 16, 8);
    }
  }

  for (const c of state.coins) {
    if (c.collected) continue;
    const floatY = c.y + Math.sin(state.frameCount * 0.1 + c.x * 0.01) * 5;
    ctx.fillStyle = COLORS.coin;
    ctx.fillRect(c.x, floatY, c.w, c.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(c.x + 4, floatY + 4, c.w / 3, c.h / 3);
  }

  for (const pu of state.powerUps) {
    if (pu.collected) continue;
    const floatY = pu.y + Math.sin(state.frameCount * 0.08 + pu.x * 0.02) * 5;
    if (pu.kind === 'doubleJump') ctx.fillStyle = COLORS.doubleJump;
    else if (pu.kind === 'shield') ctx.fillStyle = COLORS.shield;
    else ctx.fillStyle = COLORS.heart;
    ctx.fillRect(pu.x, floatY, pu.w, pu.h);
    ctx.fillStyle = '#fff';
    ctx.font = "10px 'Press Start 2P', monospace";
    const label = pu.kind === 'doubleJump' ? '↑↑' : (pu.kind === 'shield' ? '◇' : '♥');
    ctx.fillText(label, pu.x + 4, floatY + 16);
  }

  for (const e of state.enemies) {
    if (!e.alive) continue;
    if (e.kind === 'beetle') {
      const sprite = e.animFrame === 0 ? beetleSprite1 : beetleSprite2;
      drawSprite(ctx, sprite, beetlePalette, e.x, e.y, 3, e.vx > 0);
    } else {
      const sprite = e.animFrame === 0 ? batSprite1 : batSprite2;
      drawSprite(ctx, sprite, batPalette, e.x, e.y, 3, e.vx > 0);
    }
  }

  const player = state.player;
  let sprite = catSpriteSit;
  if (!player.isGrounded) sprite = catSpriteJump;
  else if (Math.abs(player.vx) > 0.1) sprite = player.animFrame === 0 ? catSpriteRun1 : catSpriteRun2;
  const blink = player.invulnerableFrames > 0 && Math.floor(state.frameCount / 4) % 2 === 0;
  if (!blink) {
    drawSprite(ctx, sprite, catPalette, player.x, player.y, player.scale, !player.facingRight);
  }
  if (player.hasShield) {
    ctx.strokeStyle = COLORS.shield;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + Math.sin(state.frameCount * 0.2) * 0.3;
    ctx.beginPath();
    ctx.arc(player.x + player.width / 2, player.y + player.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  for (const pt of state.particles) {
    ctx.globalAlpha = pt.life / pt.maxLife;
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
  }
  ctx.globalAlpha = 1;

  ctx.restore();
};

export const renderHud = (ctx: CanvasRenderingContext2D, state: GameState, highScore: number) => {
  ctx.font = "12px 'Press Start 2P', monospace";
  ctx.fillStyle = '#000';
  ctx.fillText(`Kyta: ${state.score}`, 22, 32);
  ctx.fillStyle = '#fff';
  ctx.fillText(`Kyta: ${state.score}`, 20, 30);

  ctx.fillStyle = '#000';
  ctx.fillText(`Hi: ${highScore}`, 22, 52);
  ctx.fillStyle = '#fff';
  ctx.fillText(`Hi: ${highScore}`, 20, 50);

  for (let i = 0; i < state.player.lives; i++) {
    drawSprite(ctx, heartSprite, heartPalette, GAME_WIDTH - 100 + i * 32, 20, 3, false);
  }

  if (state.player.hasDoubleJump) {
    ctx.fillStyle = COLORS.doubleJump;
    ctx.fillRect(20, GAME_HEIGHT - 36, 24, 24);
    ctx.fillStyle = '#000';
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText('↑↑', 24, GAME_HEIGHT - 18);
  }
  if (state.player.hasShield) {
    ctx.fillStyle = COLORS.shield;
    ctx.fillRect(60, GAME_HEIGHT - 36, 24, 24);
    ctx.fillStyle = '#000';
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText('◇', 64, GAME_HEIGHT - 18);
  }
};
