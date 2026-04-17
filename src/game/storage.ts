import { STORAGE_KEYS } from './constants';
import type { ControlMode } from './types';

export const getHighScore = (): number => {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.highScore);
    return v ? parseInt(v, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

export const setHighScore = (score: number) => {
  try { localStorage.setItem(STORAGE_KEYS.highScore, String(score)); } catch {}
};

export const getUnlockedLevel = (): number => {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.unlockedLevel);
    return v ? Math.max(1, parseInt(v, 10) || 1) : 1;
  } catch {
    return 1;
  }
};

export const setUnlockedLevel = (level: number) => {
  try { localStorage.setItem(STORAGE_KEYS.unlockedLevel, String(level)); } catch {}
};

const VALID_CONTROL_MODES: ControlMode[] = ['visible', 'zones', 'both'];

export const getControlMode = (): ControlMode => {
  try {
    const v = localStorage.getItem(STORAGE_KEYS.controlMode);
    if (v && (VALID_CONTROL_MODES as string[]).includes(v)) return v as ControlMode;
  } catch {}
  return 'both';
};

export const setControlMode = (mode: ControlMode) => {
  try { localStorage.setItem(STORAGE_KEYS.controlMode, mode); } catch {}
};

export const clearProgress = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.highScore);
    localStorage.removeItem(STORAGE_KEYS.unlockedLevel);
  } catch {}
};
