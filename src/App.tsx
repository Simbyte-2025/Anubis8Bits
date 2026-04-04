/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';

// --- DATOS DE SPRITES PROCEDIMENTALES ---
const catSpriteRun1 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,3,1,0,0],
    [0,1,1,1,1,1,0,0,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,0,0,0,0,1,1,2,2,2,2,2,2,2,2,2,2,0,0,0],
    [0,0,0,0,0,0,1,2,2,2,2,2,2,2,2,1,1,0,0,0],
    [0,0,0,0,0,0,1,2,2,0,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,1,1,0,0,0,1,1,0,0,0],
    [0,0,0,0,1,1,0,0,0,1,1,0,0,0,0,1,1,0,0,0],
    [0,0,0,4,4,0,0,0,0,4,4,0,0,0,0,0,4,4,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,4,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const catSpriteRun2 = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0,0,2,2,2,2,2,2,2,3,1,0,0],
    [0,0,1,1,1,1,0,0,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,1,1,0,0,1,1,2,2,2,2,2,2,2,2,2,2,0,0,0],
    [0,0,0,0,0,0,1,2,2,2,2,2,2,2,2,1,1,0,0,0],
    [0,0,0,0,0,0,0,2,2,0,0,2,2,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,1,1,0,0,1,1,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,1,1,0,0,1,1,0,0,4,4,0,0,0,0],
    [0,0,0,0,0,0,4,4,0,0,4,4,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const catSpriteSit = [
    [0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,2,2,2,3,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,2,2,2,2,2,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,2,2,2,2,2,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,2,2,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,2,2,2,2,2,2,2,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,2,2,2,2,2,2,2,1,1,0,0,0,0,0],
    [0,0,1,1,1,0,2,2,2,2,2,2,2,1,1,0,0,0,0,0],
    [0,1,1,0,1,1,1,2,2,2,2,2,1,1,0,0,0,0,0,0],
    [0,1,1,0,0,1,1,1,1,1,1,4,4,4,4,0,0,0,0,0],
    [0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
];

const COLORS = {
    sky: '#FFB6C1', // Rosa pastel
    ground: '#98FB98', // Verde menta
    dirt: '#CD853F', // Marrón
    catBase: '#F5F5DC', // Beige claro (cuerpo)
    catPoints: '#4B3621', // Marrón oscuro (puntos)
    catEye: '#87CEEB', // Azul claro (ojos)
    catSocks: '#FFFFFF', // Blanco para las patas
    coin: '#FFD700'
};

const paletteMap: Record<number, string> = {
    1: COLORS.catPoints,
    2: COLORS.catBase,
    3: COLORS.catEye,
    4: COLORS.catSocks
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  // Use refs for inputs so we don't need to re-bind event listeners
  const keysRef = useRef({
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,
    Space: false
  });

  // Game state refs to avoid dependency issues in the game loop
  const gameStateRef = useRef({
    cameraX: 0,
    score: 0,
    isGameOver: false,
    frameCount: 0,
    player: {
        x: 50,
        y: 100,
        width: 80,
        height: 52,
        vx: 0,
        vy: 0,
        speed: 8,
        jumpPower: -16,
        gravity: 0.5,
        isGrounded: false,
        facingRight: true,
        scale: 4,
        animFrame: 0
    },
    platforms: [] as any[],
    coins: [] as any[]
  });

  // Expose a reset function
  const resetGame = () => {
    const state = gameStateRef.current;
    
    // Re-init level
    state.platforms = [];
    state.coins = [];
    
    state.platforms.push({ x: 0, y: 500, w: 400, h: 100 });
    
    let currentX = 450;
    for(let i=0; i<30; i++) {
        let w = Math.random() * 150 + 100;
        let h = 30;
        let y = 300 + Math.random() * 150;
        
        state.platforms.push({ x: currentX, y: y, w: w, h: h });

        if (Math.random() > 0.3) {
            state.coins.push({ x: currentX + w/2 - 10, y: y - 40, w: 20, h: 20, collected: false });
        }

        currentX += w + (Math.random() * 100 + 50);
    }
    
    state.platforms.push({ x: currentX, y: 400, w: 300, h: 200, isGoal: true });

    state.player.x = 50;
    state.player.y = 500 - state.player.height;
    state.player.vx = 0;
    state.player.vy = 0;
    state.player.isGrounded = true;
    state.score = 0;
    state.cameraX = 0;
    state.isGameOver = false;
    
    setScore(0);
    setGameState('playing');
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    resetGame();

    const GAME_WIDTH = 800;
    const GAME_HEIGHT = 600;

    const update = () => {
        const state = gameStateRef.current;
        const keys = keysRef.current;
        const player = state.player;

        if (state.isGameOver) return;
        state.frameCount++;

        if (keys.ArrowLeft) {
            player.vx = -player.speed;
            player.facingRight = false;
            if (state.frameCount % 6 === 0) player.animFrame = (player.animFrame + 1) % 2;
        } else if (keys.ArrowRight) {
            player.vx = player.speed;
            player.facingRight = true;
            if (state.frameCount % 6 === 0) player.animFrame = (player.animFrame + 1) % 2;
        } else {
            player.vx *= 0.8;
            player.animFrame = 0;
        }

        if ((keys.ArrowUp || keys.Space) && player.isGrounded) {
            player.vy = player.jumpPower;
            player.isGrounded = false;
            keys.ArrowUp = false;
            keys.Space = false;
        }

        player.vy += player.gravity;
        if (player.vy > 15) player.vy = 15;

        let nextX = player.x + player.vx;
        let nextY = player.y + player.vy;

        player.isGrounded = false;

        for (let p of state.platforms) {
            if (nextX < p.x + p.w && nextX + player.width > p.x &&
                nextY < p.y + p.h && nextY + player.height > p.y) {
                
                if (player.vy > 0 && player.y + player.height <= p.y) {
                    player.y = p.y - player.height;
                    player.vy = 0;
                    player.isGrounded = true;
                    nextY = player.y;
                    
                    if (p.isGoal) {
                        state.isGameOver = true;
                        setGameState('won');
                    }
                }
                else if (player.vy < 0 && player.y >= p.y + p.h) {
                    player.y = p.y + p.h;
                    player.vy = 0;
                    nextY = player.y;
                }
                else if (player.vx > 0 && player.x + player.width <= p.x) {
                    player.x = p.x - player.width;
                    player.vx = 0;
                    nextX = player.x;
                }
                else if (player.vx < 0 && player.x >= p.x + p.w) {
                    player.x = p.x + p.w;
                    player.vx = 0;
                    nextX = player.x;
                }
            }
        }

        player.x = nextX;
        player.y = nextY;

        let scoreChanged = false;
        for (let c of state.coins) {
            if (!c.collected &&
                player.x < c.x + c.w && player.x + player.width > c.x &&
                player.y < c.y + c.h && player.y + player.height > c.y) {
                c.collected = true;
                state.score += 10;
                scoreChanged = true;
            }
        }
        if (scoreChanged) {
            setScore(state.score);
        }

        const cameraMargin = 300;
        if (player.x > state.cameraX + GAME_WIDTH - cameraMargin) {
            state.cameraX = player.x - GAME_WIDTH + cameraMargin;
        } else if (player.x < state.cameraX + cameraMargin && state.cameraX > 0) {
            state.cameraX = player.x - cameraMargin;
        }
        if (state.cameraX < 0) state.cameraX = 0;

        if (player.y > GAME_HEIGHT + 100) {
            state.isGameOver = true;
            setGameState('lost');
        }
    };

    const drawSprite = (matrix: number[][], posX: number, posY: number, scale: number, flipH: boolean) => {
        ctx.save();
        ctx.translate(posX, posY);
        if (flipH) {
            ctx.scale(-1, 1);
            ctx.translate(-matrix[0].length * scale, 0);
        }

        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[r].length; c++) {
                const colorCode = matrix[r][c];
                if (colorCode !== 0) {
                    ctx.fillStyle = paletteMap[colorCode];
                    ctx.fillRect(c * scale, r * scale, scale, scale);
                }
            }
        }
        ctx.restore();
    };

    const draw = () => {
        const state = gameStateRef.current;
        const player = state.player;

        ctx.fillStyle = COLORS.sky;
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        ctx.save();
        ctx.translate(-state.cameraX, 0);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for(let i=0; i<10; i++) {
            ctx.fillRect((i * 400) + (state.cameraX * 0.5) % 400, 100, 80, 40);
            ctx.fillRect((i * 400) + 40 + (state.cameraX * 0.5) % 400, 80, 60, 60);
        }

        for (let p of state.platforms) {
            ctx.fillStyle = p.isGoal ? '#FF69B4' : COLORS.ground;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            
            ctx.fillStyle = p.isGoal ? '#C71585' : COLORS.dirt;
            ctx.fillRect(p.x, p.y + 10, p.w, p.h - 10);
            
            if (p.isGoal) {
                ctx.fillStyle = '#FFF';
                ctx.font = "20px 'Press Start 2P'";
                ctx.fillText("OPA", p.x + p.w/2 - 40, p.y - 20);
            }
        }

        for (let c of state.coins) {
            if (!c.collected) {
                ctx.fillStyle = COLORS.coin;
                const floatY = c.y + Math.sin(state.frameCount * 0.1) * 5;
                ctx.fillRect(c.x, floatY, c.w, c.h);
                ctx.fillStyle = '#FFF';
                ctx.fillRect(c.x + 4, floatY + 4, c.w/3, c.h/3);
            }
        }

        let currentSprite;
        if (player.vx === 0 && player.isGrounded) {
            currentSprite = catSpriteSit;
        } else {
            currentSprite = player.animFrame === 0 ? catSpriteRun1 : catSpriteRun2;
        }
        
        drawSprite(currentSprite, player.x, player.y, player.scale, !player.facingRight);

        ctx.restore();
    };

    const gameLoop = () => {
        update();
        draw();
        animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    const handleKeyDown = (e: KeyboardEvent) => {
        if (keysRef.current.hasOwnProperty(e.code)) {
            (keysRef.current as any)[e.code] = true;
        }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (keysRef.current.hasOwnProperty(e.code)) {
            (keysRef.current as any)[e.code] = false;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const touchStateRef = useRef({
      moveTouchId: null as number | null,
      startX: 0,
      touches: new Set<number>()
  });

  const handleTouchStart = (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          touchStateRef.current.touches.add(touch.identifier);
          
          keysRef.current.ArrowUp = true;

          if (touchStateRef.current.moveTouchId === null) {
              touchStateRef.current.moveTouchId = touch.identifier;
              touchStateRef.current.startX = touch.clientX;
          }
      }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
      if (touchStateRef.current.moveTouchId !== null) {
          for (let i = 0; i < e.changedTouches.length; i++) {
              const touch = e.changedTouches[i];
              if (touch.identifier === touchStateRef.current.moveTouchId) {
                  const deltaX = touch.clientX - touchStateRef.current.startX;
                  const threshold = 15;
                  if (deltaX > threshold) {
                      keysRef.current.ArrowRight = true;
                      keysRef.current.ArrowLeft = false;
                  } else if (deltaX < -threshold) {
                      keysRef.current.ArrowLeft = true;
                      keysRef.current.ArrowRight = false;
                  } else {
                      keysRef.current.ArrowLeft = false;
                      keysRef.current.ArrowRight = false;
                  }
              }
          }
      }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          touchStateRef.current.touches.delete(touch.identifier);

          if (touch.identifier === touchStateRef.current.moveTouchId) {
              touchStateRef.current.moveTouchId = null;
              keysRef.current.ArrowLeft = false;
              keysRef.current.ArrowRight = false;
              
              if (e.touches.length > 0) {
                  touchStateRef.current.moveTouchId = e.touches[0].identifier;
                  touchStateRef.current.startX = e.touches[0].clientX;
              }
          }
      }
      
      if (e.touches.length === 0) {
          keysRef.current.ArrowUp = false;
      }
  };

  return (
    <div className="flex justify-center items-center h-screen w-screen bg-[#2c3e50] overflow-hidden font-press-start touch-none p-2 md:p-4 min-h-0 min-w-0">
      <div 
        ref={containerRef}
        className="relative bg-[#87CEEB] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden shrink-0"
        style={{
            aspectRatio: '4/3',
            width: 'min(100%, 800px)',
            height: 'min(100%, 600px)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <canvas 
            ref={canvasRef} 
            width={800}
            height={600}
            className="block w-full h-full [image-rendering:pixelated]"
        />
        
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between">
            <div className="p-5 text-white drop-shadow-[2px_2px_0_#000] text-sm flex justify-between md:text-sm text-[10px]">
                <span>Kyta: {score}</span>
                <span>Pysyrõ: 1</span>
            </div>
        </div>

        {gameState !== 'playing' && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-black/80 p-[30px] border-4 border-white text-white pointer-events-auto">
                <h2 className="mt-0 text-[#FFB6C1] text-xl mb-4">
                    {gameState === 'won' ? '¡Opa!' : '¡Mbarakaja omano!'}
                </h2>
                <p className="mb-4 text-sm leading-relaxed">
                    {gameState === 'won' ? `Kyta: ${score}` : "Re'a yvýpe."}
                </p>
                <button 
                    className="bg-[#4CAF50] border-4 border-white text-white py-[15px] px-[32px] text-center inline-block text-xs font-press-start cursor-pointer mt-5 shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
                    onClick={resetGame}
                >
                    Eha'ã jey
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
