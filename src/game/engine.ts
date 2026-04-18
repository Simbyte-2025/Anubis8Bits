import { COLORS, GAME_HEIGHT, GAME_WIDTH, PHYSICS, PLAYER } from './constants';
import { getLevel } from './levels';
import {
  batPalette, batSprite1, batSprite2,
  beetlePalette, beetleSprite1, beetleSprite2,
  cardboardBoxPalette, cardboardBoxSprite,
  catPalette, catSpriteCrouch, catSpriteJump, catSpriteRun1, catSpriteRun2, catSpriteSit,
  dogPalette, dogSprite1, dogSprite2,
  drawSprite, heartPalette, heartSprite,
  mousePalette, mouseSprite,
  roccoAwake, roccoPalette, roccoSleep,
  streetCatPalette, streetCatSprite1, streetCatSprite2,
  tunaCanPalette, tunaCanSprite
} from './sprites';
import type { Enemy, GameState, InputKeys, Particle, Player } from './types';
import { audio } from './audio';
import { initBattle } from './battle/battle';
import { BATTLE_STATS } from './battle/battleConfig';

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
  theme: 'day',
  speedMultiplier: 1
});

type LoadedImage = { img: HTMLImageElement; loaded: boolean };
const bgImages: Record<string, LoadedImage> = {};
const bgImageSrc: Record<string, string> = {
  rooftops: '/bg-rooftops.jpg',
  sunset: '/bg-sunset.jpg',
  neighborhood: '/bg-neighborhood.jpg'
};
const ensureBgImage = (theme: string): LoadedImage | null => {
  const src = bgImageSrc[theme];
  if (!src) return null;
  if (bgImages[theme]) return bgImages[theme];
  const img = new Image();
  const entry: LoadedImage = { img, loaded: false };
  img.onload = () => { entry.loaded = true; };
  img.src = src;
  bgImages[theme] = entry;
  return entry;
};

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
  inBox: false,
  boxFrames: 0,
  isCrouching: false,
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
  ensureBgImage(level.theme);
  state.platforms = level.platforms.map((p) => ({ ...p }));
  state.coins = level.coins.map((c) => ({ ...c, collected: false }));
  const baseSpeed = (k: string) => {
    if (k === 'beetle') return 1.4;
    if (k === 'streetCat') return 2.2;
    if (k === 'dog') return 1.6;
    return 1.8;
  };
  state.enemies = level.enemies.map((e) => ({
    ...e,
    vx: e.kind === 'rocco' ? 0 : baseSpeed(e.kind),
    vy: 0,
    baseY: e.y,
    alive: true,
    animFrame: 0,
    alertTimer: 0,
    awakeTimer: 0
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

/**
 * Inicia el modo batalla pausando el update del mundo.
 * Se invoca cuando Anubis choca con un enemigo que tiene stats de batalla (Fase 1: solo rocco).
 * El engine normal no corre durante battle (update() hace early return cuando screen !== 'playing').
 */
const triggerBattle = (state: GameState, enemy: Enemy, index: number): boolean => {
  if (state.player.invulnerableFrames > 0) return false;
  if (!BATTLE_STATS[enemy.kind]) return false;
  state.screen = 'battle';
  state.battle = initBattle(enemy, index);
  audio.play('powerup');
  return true;
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
  if (player.inBox) {
    player.inBox = false;
    player.boxFrames = 0;
    player.invulnerableFrames = 30;
    audio.play('hit');
    spawnParticles(state, player.x + player.width / 2, player.y + player.height / 2, 10, '#a86b3a', 4);
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

  const wasCrouching = player.isCrouching;
  player.isCrouching = !!keys.ArrowDown && player.isGrounded;
  if (player.isCrouching && !wasCrouching) {
    player.y += PLAYER.height - 28;
    player.height = 28;
  } else if (!player.isCrouching && wasCrouching) {
    player.y -= PLAYER.height - 28;
    player.height = PLAYER.height;
  }

  const speedBase = PHYSICS.playerSpeed * (state.speedMultiplier || 1);
  const speed = player.isCrouching ? speedBase * 0.5 : speedBase;
  if (keys.ArrowLeft) {
    player.vx = -speed;
    player.facingRight = false;
    if (state.frameCount % 6 === 0) player.animFrame = (player.animFrame + 1) % 2;
  } else if (keys.ArrowRight) {
    player.vx = speed;
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
  if (player.inBox) {
    player.boxFrames++;
    if (player.boxFrames > 600) player.inBox = false;
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
      const isMouse = c.kind === 'mouse';
      state.score += isMouse ? 25 : 10;
      scoreChanged = true;
      audio.play(isMouse ? 'powerup' : 'coin');
      spawnParticles(state, c.x + c.w / 2, c.y + c.h / 2, isMouse ? 10 : 6, isMouse ? '#ff8888' : COLORS.coin, isMouse ? 3 : 2);
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
      } else if (pu.kind === 'cardboardBox') {
        player.inBox = true;
        player.boxFrames = 0;
        spawnParticles(state, pu.x + pu.w / 2, pu.y + pu.h / 2, 10, '#a86b3a', 3);
      }
      scoreChanged = true;
    }
  }
  if (scoreChanged) onScoreChange();

  for (let i = 0; i < state.enemies.length; i++) {
    const e = state.enemies[i];
    if (!e.alive) continue;
    if (e.kind === 'rocco') {
      // Hitbox de alerta = el doble del visual, centrado
      const alertW = e.w * 2.2;
      const alertH = e.h * 1.6;
      const alertX = e.x - (alertW - e.w) / 2;
      const alertY = e.y - (alertH - e.h) / 2;
      const inAlert =
        player.x < alertX + alertW && player.x + player.width > alertX &&
        player.y < alertY + alertH && player.y + player.height > alertY;
      const inTouch = aabb(player, e);
      const sneaking = player.isCrouching && Math.abs(player.vx) < 1;
      if (e.awakeTimer && e.awakeTimer > 0) {
        e.awakeTimer--;
        if (inTouch) {
          if (triggerBattle(state, e, i)) return;
          damagePlayer(state, e.x);
        }
      } else if (inTouch || (inAlert && !sneaking)) {
        e.alertTimer = (e.alertTimer || 0) + 1;
        if (e.alertTimer > 60 || inTouch) {
          e.awakeTimer = 180;
          e.alertTimer = 0;
          audio.play('hit');
          spawnParticles(state, e.x + e.w / 2, e.y, 14, '#ff5050', 4);
          if (triggerBattle(state, e, i)) return;
          damagePlayer(state, e.x);
        }
      } else {
        if (e.alertTimer && e.alertTimer > 0) e.alertTimer = Math.max(0, e.alertTimer - 2);
      }
      continue;
    }
    const isFlyer = e.kind === 'bat';
    if (isFlyer) {
      e.x += e.vx;
      e.y = e.baseY + Math.sin(state.frameCount * 0.05 + e.patrolMin * 0.01) * 30;
      if (e.x < e.patrolMin) { e.x = e.patrolMin; e.vx = Math.abs(e.vx); }
      if (e.x + e.w > e.patrolMax) { e.x = e.patrolMax - e.w; e.vx = -Math.abs(e.vx); }
      if (state.frameCount % 6 === 0) e.animFrame = (e.animFrame + 1) % 2;
    } else {
      e.x += e.vx;
      if (e.x < e.patrolMin) { e.x = e.patrolMin; e.vx = Math.abs(e.vx); }
      if (e.x + e.w > e.patrolMax) { e.x = e.patrolMax - e.w; e.vx = -Math.abs(e.vx); }
      const animPace = e.kind === 'streetCat' ? 6 : (e.kind === 'dog' ? 12 : 10);
      if (state.frameCount % animPace === 0) e.animFrame = (e.animFrame + 1) % 2;
    }
    // Si Anubis está escondida en la caja, los perros no la ven
    const dogIgnores = e.kind === 'dog' && player.inBox;
    if (!dogIgnores && aabb(player, e)) {
      const stomping = player.vy > 0 && player.y + player.height - 12 < e.y;
      const stompable = e.kind !== 'dog'; // perros no se pisan
      if (stomping && stompable) {
        e.alive = false;
        player.vy = -10;
        player.doubleJumpUsed = false;
        state.score += e.kind === 'streetCat' ? 35 : 25;
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
  const bgEntry = ensureBgImage(theme);
  if (bgEntry) {
    if (bgEntry.loaded && bgEntry.img.naturalWidth > 0) {
      const img = bgEntry.img;
      const scale = GAME_HEIGHT / img.naturalHeight;
      const drawW = img.naturalWidth * scale;
      const offset = (state.cameraX * 0.35) % drawW;
      for (let x = -offset; x < GAME_WIDTH; x += drawW) {
        ctx.drawImage(img, x, 0, drawW, GAME_HEIGHT);
      }
    } else {
      const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      grad.addColorStop(0, theme === 'sunset' ? '#ff7e5f' : '#1a1a3a');
      grad.addColorStop(1, theme === 'sunset' ? '#feb47b' : '#3a2a4a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
    return;
  }
  if (theme === 'indoors') {
    const grad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
    grad.addColorStop(0, '#5a3a22');
    grad.addColorStop(1, '#3a2412');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    // wallpaper stripes
    ctx.fillStyle = 'rgba(255, 200, 120, 0.06)';
    for (let i = 0; i < 30; i++) {
      const x = (i * 60 - state.cameraX * 0.4) % (GAME_WIDTH + 60);
      const xx = x < -60 ? x + GAME_WIDTH + 60 : x;
      ctx.fillRect(xx, 0, 30, GAME_HEIGHT);
    }
    // moon through window (top-right)
    ctx.fillStyle = '#fff8d0';
    ctx.beginPath();
    ctx.arc(GAME_WIDTH - 100, 80, 28, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
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
    let topColor: string = COLORS.ground;
    let bodyColor: string = COLORS.dirt;
    if (state.theme === 'night') { topColor = COLORS.groundNight; bodyColor = COLORS.dirtNight; }
    else if (state.theme === 'desert') { topColor = '#deb887'; bodyColor = '#a0522d'; }
    else if (state.theme === 'rooftops') { topColor = '#5b4a6a'; bodyColor = '#2a1f3a'; }
    else if (state.theme === 'sunset') { topColor = '#8b3a3a'; bodyColor = '#3a1a1a'; }
    else if (state.theme === 'neighborhood') { topColor = '#3a4a5a'; bodyColor = '#1a1a2a'; }
    else if (state.theme === 'indoors') { topColor = '#a86b3a'; bodyColor = '#5a3a22'; }
    ctx.fillStyle = isHazard ? COLORS.spike : topColor;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = bodyColor;
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
    ctx.fillText('META', g.x + g.w / 2 - 48, g.y - 24 + bob);
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
    if (c.kind === 'mouse') {
      drawSprite(ctx, mouseSprite, mousePalette, c.x - 4, floatY, 3, false);
    } else {
      drawSprite(ctx, tunaCanSprite, tunaCanPalette, c.x, floatY, 3, false);
    }
  }

  for (const pu of state.powerUps) {
    if (pu.collected) continue;
    const floatY = pu.y + Math.sin(state.frameCount * 0.08 + pu.x * 0.02) * 5;
    if (pu.kind === 'cardboardBox') {
      drawSprite(ctx, cardboardBoxSprite, cardboardBoxPalette, pu.x - 5, floatY, 2, false);
      continue;
    }
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
    } else if (e.kind === 'bat') {
      const sprite = e.animFrame === 0 ? batSprite1 : batSprite2;
      drawSprite(ctx, sprite, batPalette, e.x, e.y, 3, e.vx > 0);
    } else if (e.kind === 'streetCat') {
      const sprite = e.animFrame === 0 ? streetCatSprite1 : streetCatSprite2;
      drawSprite(ctx, sprite, streetCatPalette, e.x, e.y, 3, e.vx > 0);
    } else if (e.kind === 'dog') {
      const sprite = e.animFrame === 0 ? dogSprite1 : dogSprite2;
      drawSprite(ctx, sprite, dogPalette, e.x, e.y, 3, e.vx > 0);
    } else if (e.kind === 'rocco') {
      const awake = (e.awakeTimer || 0) > 0;
      const sprite = awake ? roccoAwake : roccoSleep;
      drawSprite(ctx, sprite, roccoPalette, e.x, e.y, 3, false);
      if (!awake) {
        // Z animadas sobre Rocco dormido
        ctx.fillStyle = '#fff';
        ctx.font = "12px 'Press Start 2P', monospace";
        for (let i = 0; i < 3; i++) {
          const phase = (state.frameCount * 0.04 + i * 1.2) % 3;
          const zx = e.x + e.w / 2 + i * 8 - 12;
          const zy = e.y - 6 - phase * 14;
          const alpha = 1 - phase / 3;
          ctx.globalAlpha = alpha;
          ctx.fillText('Z', zx, zy);
        }
        ctx.globalAlpha = 1;
      }
      if ((e.alertTimer || 0) > 0 && !awake) {
        ctx.fillStyle = '#ffe066';
        ctx.font = "16px 'Press Start 2P', monospace";
        ctx.fillText('?', e.x + e.w / 2 - 6, e.y - 14);
      }
    }
  }

  const player = state.player;
  let sprite = catSpriteSit;
  if (player.isCrouching) sprite = catSpriteCrouch;
  else if (!player.isGrounded) sprite = catSpriteJump;
  else if (Math.abs(player.vx) > 0.1) sprite = player.animFrame === 0 ? catSpriteRun1 : catSpriteRun2;
  const blink = player.invulnerableFrames > 0 && Math.floor(state.frameCount / 4) % 2 === 0;
  if (!blink) {
    if (player.inBox) {
      drawSprite(ctx, cardboardBoxSprite, cardboardBoxPalette, player.x + 8, player.y + (player.isCrouching ? 0 : 24), 4, false);
    } else {
      drawSprite(ctx, sprite, catPalette, player.x, player.y, player.scale, !player.facingRight);
    }
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
  ctx.fillText(`Puntos: ${state.score}`, 22, 32);
  ctx.fillStyle = '#fff';
  ctx.fillText(`Puntos: ${state.score}`, 20, 30);

  ctx.fillStyle = '#000';
  ctx.fillText(`Récord: ${highScore}`, 22, 52);
  ctx.fillStyle = '#fff';
  ctx.fillText(`Récord: ${highScore}`, 20, 50);

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
  if (state.player.inBox) {
    ctx.fillStyle = '#a86b3a';
    ctx.fillRect(100, GAME_HEIGHT - 36, 24, 24);
    ctx.fillStyle = '#fff';
    ctx.font = "10px 'Press Start 2P', monospace";
    ctx.fillText('📦', 102, GAME_HEIGHT - 18);
  }
};
