import React, { useEffect, useRef, useState } from 'react';
import { GAME_HEIGHT, SPEED_MULTIPLIERS, VIEW, viewWidthForAspect } from './game/constants';
import { createFixedStepper } from './game/loop';
import { createInitialState, loadLevel, render, renderHud, update } from './game/engine';
import { updateBattle } from './game/battle/battle';
import { renderBattle } from './game/battle/battleRender';
import { audio } from './game/audio';
import {
  clearProgress, getControlMode, getHighScore, getInfiniteLives, getSpeedPreset, getUnlockedLevel,
  setControlMode, setHighScore, setInfiniteLives, setSpeedPreset, setUnlockedLevel
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

  // Solo en desarrollo: acceso al estado para pruebas visuales automatizadas.
  if (import.meta.env.DEV) (window as unknown as { __anubis: GameState }).__anubis = stateRef.current;

  const [, force] = useState(0);
  const [screen, setScreen] = useState<GameScreen>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScoreState] = useState(getHighScore());
  const [unlockedLevel, setUnlockedLevelState] = useState(getUnlockedLevel());
  const [muted, setMuted] = useState(audio.isMuted());
  const [controlMode, setControlModeState] = useState<ControlMode>(getControlMode());
  const [speedPreset, setSpeedPresetState] = useState<SpeedPreset>(getSpeedPreset());
  const [infiniteLives, setInfiniteLivesState] = useState(getInfiniteLives());
  const shellRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ viewW: VIEW.width, cssW: VIEW.width, cssH: GAME_HEIGHT });

  useEffect(() => {
    stateRef.current.speedMultiplier = SPEED_MULTIPLIERS[speedPreset];
  }, [speedPreset]);

  useEffect(() => {
    stateRef.current.infiniteLives = infiniteLives;
  }, [infiniteLives]);

  // Ajusta el canvas a la pantalla sin deformarlo: altura lógica fija (600) y
  // ancho lógico según la proporción disponible, escalado uniforme.
  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;
    const measure = () => {
      const rect = shell.getBoundingClientRect();
      const style = getComputedStyle(shell);
      const availW = rect.width - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      const availH = rect.height - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
      if (availW <= 0 || availH <= 0) return;
      const viewW = viewWidthForAspect(availW / availH);
      const scale = Math.min(availW / viewW, availH / GAME_HEIGHT);
      VIEW.width = viewW;
      setFit({ viewW, cssW: Math.floor(viewW * scale), cssH: Math.floor(GAME_HEIGHT * scale) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(shell);
    window.addEventListener('orientationchange', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
    };
  }, []);

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
    stateRef.current.infiniteLives = infiniteLives;
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

  const toggleInfiniteLives = () => {
    const next = !infiniteLives;
    setInfiniteLives(next);
    setInfiniteLivesState(next);
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
    const stepper = createFixedStepper();

    // La lógica avanza en pasos fijos de 1/60 s (misma velocidad en pantallas
    // de 60, 90 o 120 Hz); el dibujo ocurre una vez por cuadro de pantalla.
    const tick = () => {
      const s = stateRef.current;
      if (s.screen === 'battle') {
        updateBattle(s, keysRef.current);
        // Si la batalla cerró en este paso, sincronizar score UI (victoria sumó puntos)
        if (s.screen !== 'battle') handleScoreChange();
      } else {
        update(s, keysRef.current, handleScoreChange, handleWin);
      }
    };

    const loop = (now: number) => {
      const s = stateRef.current;
      try {
        stepper.advance(now, tick);
        if (canvas.width !== VIEW.width) canvas.width = VIEW.width;
        ctx.imageSmoothingEnabled = false;
        if (s.screen === 'battle') {
          renderBattle(ctx, s);
        } else {
          render(ctx, s);
          renderHud(ctx, s, highScore);
        }
        syncScreen();
      } catch (err) {
        // Mantenemos el rAF vivo aunque un tick lance — si no, el canvas se congela sin feedback
        // eslint-disable-next-line no-console
        console.error('[game loop]', err);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

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
        <div>Gira la pantalla</div>
        <div style={{ marginTop: 8, opacity: 0.7 }}>Modo horizontal</div>
      </div>

      <div
        ref={shellRef}
        className="game-shell flex justify-center items-center h-[100dvh] w-screen bg-[#2c3e50] overflow-hidden font-press-start touch-none min-h-0 min-w-0"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <div
          ref={containerRef}
          className="relative bg-[#87CEEB] shadow-[0_0_20px_rgba(0,0,0,0.5)] overflow-hidden shrink-0"
          style={{ width: fit.cssW, height: fit.cssH }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
        >
          <canvas
            ref={canvasRef}
            width={fit.viewW}
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
              infiniteLives={infiniteLives}
              onToggleInfiniteLives={toggleInfiniteLives}
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
              subtitle={`Se acabaron las vidas.\nPuntos: ${score}`}
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
