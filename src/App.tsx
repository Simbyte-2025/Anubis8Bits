import React, { useEffect, useRef, useState } from 'react';
import { GAME_HEIGHT, GAME_WIDTH, SPEED_MULTIPLIERS } from './game/constants';
import { createInitialState, loadLevel, render, renderHud, update } from './game/engine';
import { updateBattle } from './game/battle/battle';
import { renderBattle } from './game/battle/battleRender';
import { audio } from './game/audio';
import {
  clearProgress, getControlMode, getHighScore, getSpeedPreset, getUnlockedLevel,
  setControlMode, setHighScore, setSpeedPreset, setUnlockedLevel
} from './game/storage';
import { levels } from './game/levels';
import type { ControlMode, GameScreen, GameState, InputKeys, SpeedPreset } from './game/types';
import { MainMenu, ScreenOverlay, SettingsScreen } from './components/Menu';
import { TouchControls, type TouchAction } from './components/TouchControls';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<GameState>(createInitialState());
  const keysRef = useRef<InputKeys>({
    ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, Space: false, KeyP: false
  });
  const audioUnlockedRef = useRef(false);

  const [, force] = useState(0);
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(getHighScore());
  const [unlockedLevel, setUnlockedLevelState] = useState(getUnlockedLevel());
  const [muted, setMuted] = useState(audio.isMuted());
  const [controlMode, setControlModeState] = useState<ControlMode>(getControlMode());
  const [speedPreset, setSpeedPresetState] = useState<SpeedPreset>(getSpeedPreset());

  useEffect(() => {
    stateRef.current.speedMultiplier = SPEED_MULTIPLIERS[speedPreset];
  }, [speedPreset]);

  const syncScreen = () => {
    if (stateRef.current.screen !== screen) setScreen(stateRef.current.screen);
  };

  const handleScoreChange = () => setScore(stateRef.current.score);

  const handleWin = () => {
    const finished = stateRef.current.currentLevelId;
    const next = finished + 1;
    const totalForRun = stateRef.current.score + 50 * stateRef.current.player.lives;
    if (totalForRun > getHighScore()) {
      setHighScore(totalForRun);
      setHighScoreState(totalForRun);
    }
    if (next <= levels.length && next > getUnlockedLevel()) {
      setUnlockedLevel(next);
      setUnlockedLevelState(next);
    }
    if (next > levels.length) {
      stateRef.current.screen = 'gameComplete';
    }
  };

  const startLevel = (id: number, keepLives: boolean) => {
    loadLevel(stateRef.current, id, keepLives);
    stateRef.current.speedMultiplier = SPEED_MULTIPLIERS[speedPreset];
    setScore(0);
    setScreen('playing');
    force((n) => n + 1);
  };

  const goToMenu = () => {
    stateRef.current.screen = 'menu';
    setScreen('menu');
  };

  const openSettings = () => {
    stateRef.current.screen = 'settings';
    setScreen('settings');
  };

  const togglePause = () => {
    const s = stateRef.current;
    if (s.screen === 'playing') { s.screen = 'paused'; setScreen('paused'); }
    else if (s.screen === 'paused') { s.screen = 'playing'; setScreen('playing'); }
  };

  const toggleMute = () => setMuted(audio.toggleMute());

  const changeControlMode = (mode: ControlMode) => {
    setControlMode(mode);
    setControlModeState(mode);
  };

  const changeSpeedPreset = (p: SpeedPreset) => {
    setSpeedPreset(p);
    setSpeedPresetState(p);
  };

  const handleClearProgress = () => {
    clearProgress();
    setHighScoreState(0);
    setUnlockedLevelState(1);
  };

  const handleTouchAction = (action: TouchAction, pressed: boolean) => {
    if (action === 'left') keysRef.current.ArrowLeft = pressed;
    else if (action === 'right') keysRef.current.ArrowRight = pressed;
    else if (action === 'jump') keysRef.current.ArrowUp = pressed;
    else if (action === 'crouch') keysRef.current.ArrowDown = pressed;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;

    const loop = () => {
      const s = stateRef.current;
      const wasBattle = s.screen === 'battle';
      if (wasBattle) {
        updateBattle(s, keysRef.current);
        renderBattle(ctx, s);
        // Si la batalla cerró en este frame, sincronizar score UI (victoria sumó puntos)
        if (s.screen !== 'battle') handleScoreChange();
      } else {
        update(s, keysRef.current, handleScoreChange, handleWin);
        render(ctx, s);
        renderHud(ctx, s, highScore);
      }
      syncScreen();
      raf = requestAnimationFrame(loop);
    };
    loop();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyP') { e.preventDefault(); togglePause(); return; }
      if (e.code === 'KeyM') { e.preventDefault(); toggleMute(); return; }
      if ((keysRef.current as any).hasOwnProperty(e.code)) {
        (keysRef.current as any)[e.code] = true;
        if (e.code === 'ArrowUp' || e.code === 'ArrowDown' || e.code === 'Space') e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if ((keysRef.current as any).hasOwnProperty(e.code)) {
        (keysRef.current as any)[e.code] = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      // Touch a no-op SFX to force AudioContext creation/resume on iOS.
      const wasMuted = audio.isMuted();
      if (!wasMuted) audio.play('land');
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highScore]);

  // --- Invisible touch zones (only when controlMode is 'zones' or 'both') ---
  const touchStateRef = useRef({
    moveTouchId: null as number | null,
    jumpTouchId: null as number | null,
    startX: 0
  });

  const zonesEnabled = controlMode === 'zones' || controlMode === 'both';

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!zonesEnabled) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      const isLeft = (t.clientX - rect.left) < rect.width / 2;
      if (isLeft) {
        if (touchStateRef.current.moveTouchId === null) {
          touchStateRef.current.moveTouchId = t.identifier;
          touchStateRef.current.startX = t.clientX;
        }
      } else {
        keysRef.current.ArrowUp = true;
        touchStateRef.current.jumpTouchId = t.identifier;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!zonesEnabled || touchStateRef.current.moveTouchId === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchStateRef.current.moveTouchId) {
        const dx = t.clientX - touchStateRef.current.startX;
        const threshold = 15;
        keysRef.current.ArrowRight = dx > threshold;
        keysRef.current.ArrowLeft = dx < -threshold;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!zonesEnabled) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier === touchStateRef.current.moveTouchId) {
        touchStateRef.current.moveTouchId = null;
        keysRef.current.ArrowLeft = false;
        keysRef.current.ArrowRight = false;
      }
      if (t.identifier === touchStateRef.current.jumpTouchId) {
        touchStateRef.current.jumpTouchId = null;
        keysRef.current.ArrowUp = false;
      }
    }
    if (e.touches.length === 0) {
      keysRef.current.ArrowLeft = false;
      keysRef.current.ArrowRight = false;
      keysRef.current.ArrowUp = false;
      touchStateRef.current.moveTouchId = null;
      touchStateRef.current.jumpTouchId = null;
    }
  };

  const currentLevelId = stateRef.current.currentLevelId;
  const isLastLevel = currentLevelId >= levels.length;
  const showVisibleControls = (controlMode === 'visible' || controlMode === 'both') && (screen === 'playing' || screen === 'battle');
  const inBattle = screen === 'battle';

  return (
    <>
      <div className="rotate-overlay">
        <div style={{ fontSize: 36, marginBottom: 16 }}>🔄</div>
        <div>Gira el iPad</div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>Modo horizontal</div>
      </div>

      <div className="game-shell flex justify-center items-center h-screen w-screen bg-[#2c3e50] overflow-hidden font-press-start touch-none p-2 md:p-4 min-h-0 min-w-0">
        <div
          ref={containerRef}
          className="relative bg-[#87CEEB] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden shrink-0"
          style={{
            aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}`,
            width: `min(100%, ${GAME_WIDTH}px)`,
            height: `min(100%, ${GAME_HEIGHT}px)`
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={GAME_WIDTH}
            height={GAME_HEIGHT}
            className="block w-full h-full [image-rendering:pixelated]"
          />

          {showVisibleControls && <TouchControls onPress={handleTouchAction} inBattle={inBattle} />}

          {screen === 'playing' && (
            <button
              onClick={togglePause}
              className="absolute top-2 right-2 text-white text-[10px] bg-black/50 px-2 py-1 border border-white pointer-events-auto z-20"
            >
              ⏸
            </button>
          )}

          {screen === 'menu' && (
            <MainMenu
              highScore={highScore}
              unlockedLevel={unlockedLevel}
              muted={muted}
              onPlay={(id) => startLevel(id, false)}
              onToggleMute={toggleMute}
              onOpenSettings={openSettings}
            />
          )}

          {screen === 'settings' && (
            <SettingsScreen
              controlMode={controlMode}
              speedPreset={speedPreset}
              muted={muted}
              onChangeControlMode={changeControlMode}
              onChangeSpeedPreset={changeSpeedPreset}
              onToggleMute={toggleMute}
              onClearProgress={handleClearProgress}
              onBack={goToMenu}
            />
          )}

          {screen === 'paused' && (
            <ScreenOverlay
              title="Pausa"
              subtitle="Tecla P para continuar"
              primaryLabel="Continuar"
              onPrimary={togglePause}
              secondaryLabel="Menú principal"
              onSecondary={goToMenu}
            />
          )}

          {screen === 'won' && (
            <ScreenOverlay
              title="¡Lo lograste!"
              subtitle={`Puntos: ${score}${isLastLevel ? '' : `\nNivel ${currentLevelId + 1} desbloqueado`}`}
              primaryLabel={isLastLevel ? '¡Completaste todo!' : 'Siguiente nivel'}
              onPrimary={() => isLastLevel ? goToMenu() : startLevel(currentLevelId + 1, true)}
              secondaryLabel="Menú principal"
              onSecondary={goToMenu}
            />
          )}

          {screen === 'lost' && (
            <ScreenOverlay
              title="¡Anubis cayó!"
              subtitle={`Te caíste al vacío.\nPuntos finales: ${score}`}
              primaryLabel="Intentar de nuevo"
              onPrimary={() => startLevel(currentLevelId, false)}
              secondaryLabel="Menú principal"
              onSecondary={goToMenu}
            />
          )}

          {screen === 'gameComplete' && (
            <ScreenOverlay
              title="¡Anubis lo logró!"
              subtitle={`Completaste todos los niveles.\nPuntos totales: ${score}`}
              primaryLabel="Volver al menú"
              onPrimary={goToMenu}
            />
          )}
        </div>
      </div>
    </>
  );
}
