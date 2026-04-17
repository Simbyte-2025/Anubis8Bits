import React, { useRef } from 'react';

export type TouchAction = 'left' | 'right' | 'jump' | 'crouch';

interface Props {
  onPress: (action: TouchAction, pressed: boolean) => void;
}

export const TouchControls: React.FC<Props> = ({ onPress }) => {
  const activeRef = useRef<Record<number, TouchAction>>({});

  const start = (action: TouchAction) => (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    activeRef.current[e.pointerId] = action;
    onPress(action, true);
  };

  const end = (action: TouchAction) => (e: React.PointerEvent) => {
    e.preventDefault();
    delete activeRef.current[e.pointerId];
    onPress(action, false);
  };

  const baseBtn =
    'select-none touch-none flex items-center justify-center font-press-start text-white border-4 border-white shadow-[4px_4px_0_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#000] pointer-events-auto';

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="absolute bottom-3 left-3 flex gap-3">
        <button
          aria-label="Izquierda"
          onPointerDown={start('left')}
          onPointerUp={end('left')}
          onPointerCancel={end('left')}
          onPointerLeave={end('left')}
          className={`${baseBtn} bg-[#4CAF50]/90 w-16 h-16 md:w-20 md:h-20 text-2xl md:text-3xl rounded-full`}
        >
          ◀
        </button>
        <button
          aria-label="Derecha"
          onPointerDown={start('right')}
          onPointerUp={end('right')}
          onPointerCancel={end('right')}
          onPointerLeave={end('right')}
          className={`${baseBtn} bg-[#4CAF50]/90 w-16 h-16 md:w-20 md:h-20 text-2xl md:text-3xl rounded-full`}
        >
          ▶
        </button>
      </div>
      <button
        aria-label="Sigilo"
        onPointerDown={start('crouch')}
        onPointerUp={end('crouch')}
        onPointerCancel={end('crouch')}
        onPointerLeave={end('crouch')}
        className={`${baseBtn} absolute bottom-3 right-28 md:right-32 bg-[#7ec8ff]/90 w-14 h-14 md:w-16 md:h-16 text-xl md:text-2xl rounded-full`}
      >
        🤫
      </button>
      <button
        aria-label="Saltar"
        onPointerDown={start('jump')}
        onPointerUp={end('jump')}
        onPointerCancel={end('jump')}
        onPointerLeave={end('jump')}
        className={`${baseBtn} absolute bottom-3 right-3 bg-[#FF69B4]/90 w-20 h-20 md:w-24 md:h-24 text-2xl md:text-3xl rounded-full`}
      >
        A
      </button>
    </div>
  );
};
