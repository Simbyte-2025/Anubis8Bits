import React from 'react';
import { levels } from '../game/levels';
import type { ControlMode, SpeedPreset } from '../game/types';

interface MenuProps {
  highScore: number;
  unlockedLevel: number;
  muted: boolean;
  onPlay: (levelId: number) => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MenuProps> = ({
  highScore, unlockedLevel, muted, onPlay, onToggleMute, onOpenSettings
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white p-4 md:p-6 pointer-events-auto overflow-auto">
    <h1 className="text-[#FFB6C1] text-2xl md:text-4xl mb-2 text-center">Kitten Jump</h1>
    <p className="text-[10px] md:text-sm mb-4 opacity-80">Mbarakaja oñembosarái</p>
    <p className="text-[10px] md:text-xs mb-4">Hi-Score: {highScore}</p>

    <div className="flex flex-col gap-2 md:gap-3 w-full max-w-xs">
      {levels.map((lvl) => {
        const locked = lvl.id > unlockedLevel;
        return (
          <button
            key={lvl.id}
            disabled={locked}
            onClick={() => onPlay(lvl.id)}
            className={`border-4 border-white py-2 md:py-3 px-3 md:px-4 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] ${
              locked ? 'bg-gray-600 opacity-60 cursor-not-allowed' : 'bg-[#4CAF50] hover:bg-[#5fbf5f] cursor-pointer'
            }`}
          >
            {locked ? `🔒 Nivel ${lvl.id}` : `Nivel ${lvl.id}: ${lvl.name}`}
          </button>
        );
      })}
    </div>

    <div className="flex gap-3 mt-4">
      <button
        onClick={onOpenSettings}
        className="bg-[#555] border-4 border-white text-white py-2 px-4 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
      >
        ⚙ Ajustes
      </button>
      <button
        onClick={onToggleMute}
        className="bg-[#555] border-4 border-white text-white py-2 px-4 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>

    <div className="mt-4 text-[8px] md:text-[10px] opacity-80 text-center max-w-md leading-relaxed">
      <p>← → moverse · ↑ / Space saltar · P pausa · M mute</p>
      <p>Móvil: usa los botones en pantalla</p>
    </div>
  </div>
);

interface SettingsProps {
  controlMode: ControlMode;
  speedPreset: SpeedPreset;
  muted: boolean;
  onChangeControlMode: (mode: ControlMode) => void;
  onChangeSpeedPreset: (p: SpeedPreset) => void;
  onToggleMute: () => void;
  onClearProgress: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsProps> = ({
  controlMode, speedPreset, muted,
  onChangeControlMode, onChangeSpeedPreset, onToggleMute, onClearProgress, onBack
}) => {
  const opt = (mode: ControlMode, label: string, desc: string) => (
    <button
      key={mode}
      onClick={() => onChangeControlMode(mode)}
      className={`text-left border-4 border-white py-2 px-3 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] ${
        controlMode === mode ? 'bg-[#4CAF50]' : 'bg-[#333]'
      }`}
    >
      <div>{controlMode === mode ? '● ' : '○ '}{label}</div>
      <div className="text-[8px] md:text-[10px] opacity-70 mt-1">{desc}</div>
    </button>
  );

  const speedOpt = (p: SpeedPreset, label: string, desc: string) => (
    <button
      key={p}
      onClick={() => onChangeSpeedPreset(p)}
      className={`text-left border-4 border-white py-2 px-3 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] ${
        speedPreset === p ? 'bg-[#4CAF50]' : 'bg-[#333]'
      }`}
    >
      <div>{speedPreset === p ? '● ' : '○ '}{label}</div>
      <div className="text-[8px] md:text-[10px] opacity-70 mt-1">{desc}</div>
    </button>
  );

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white p-4 md:p-6 pointer-events-auto overflow-auto">
      <h2 className="text-[#FFB6C1] text-xl md:text-2xl mb-4">⚙ Ajustes</h2>

      <div className="w-full max-w-sm flex flex-col gap-2 md:gap-3">
        <p className="text-[10px] md:text-xs mb-1">Velocidad del personaje</p>
        {speedOpt('slow', '🐢 Lenta', 'Más fácil — 70% velocidad')}
        {speedOpt('normal', '🐈 Normal', '100% velocidad')}
        {speedOpt('fast', '⚡ Rápida', 'Más difícil — 130% velocidad')}

        <div className="h-2" />

        <p className="text-[10px] md:text-xs mb-1">Controles táctiles</p>
        {opt('visible', 'Botones en pantalla', 'D-pad y botón A visibles')}
        {opt('zones', 'Zonas invisibles', 'Mitad izq mover, mitad der saltar')}
        {opt('both', 'Ambos', 'Botones visibles + zonas activas')}

        <div className="h-2" />

        <button
          onClick={onToggleMute}
          className="border-4 border-white bg-[#333] text-white py-2 px-3 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
        >
          Sonido: {muted ? '🔇 OFF' : '🔊 ON'}
        </button>

        <button
          onClick={() => {
            if (confirm('¿Borrar high-score y niveles desbloqueados?')) onClearProgress();
          }}
          className="border-4 border-white bg-[#aa3333] text-white py-2 px-3 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
        >
          🗑 Borrar progreso
        </button>

        <button
          onClick={onBack}
          className="border-4 border-white bg-[#4CAF50] text-white py-2 px-3 text-[10px] md:text-xs font-press-start shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] mt-4"
        >
          ← Volver
        </button>
      </div>
    </div>
  );
};

interface OverlayProps {
  title: string;
  subtitle?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export const ScreenOverlay: React.FC<OverlayProps> = ({ title, subtitle, primaryLabel, onPrimary, secondaryLabel, onSecondary }) => (
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center bg-black/85 p-6 md:p-8 border-4 border-white text-white pointer-events-auto min-w-[260px]">
    <h2 className="mt-0 text-[#FFB6C1] text-lg md:text-xl mb-3">{title}</h2>
    {subtitle && <p className="mb-4 text-[10px] md:text-sm leading-relaxed whitespace-pre-line">{subtitle}</p>}
    <div className="flex flex-col gap-3 mt-4">
      <button
        onClick={onPrimary}
        className="bg-[#4CAF50] border-4 border-white text-white py-3 px-6 text-[10px] md:text-xs font-press-start cursor-pointer shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
      >
        {primaryLabel}
      </button>
      {secondaryLabel && onSecondary && (
        <button
          onClick={onSecondary}
          className="bg-[#555] border-4 border-white text-white py-3 px-6 text-[10px] md:text-xs font-press-start cursor-pointer shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000]"
        >
          {secondaryLabel}
        </button>
      )}
    </div>
  </div>
);
