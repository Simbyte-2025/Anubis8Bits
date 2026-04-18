// Sprites exclusivos del modo batalla: Anubis de espaldas y enemigos de frente.
// Estilo consistente con los sprites side-scroll del juego (paletas tipo Anubis).

export const anubisBack = [
  [0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,1,1,0,1,1,1,0,0],
  [0,1,1,2,2,3,2,2,1,1,0],
  [0,1,2,2,2,2,2,2,2,1,0],
  [0,1,2,2,2,2,2,2,2,1,0],
  [0,1,2,2,2,2,2,2,2,1,0],
  [0,0,1,2,2,2,2,2,1,0,0],
  [0,0,1,2,1,0,1,2,1,0,0],
  [0,0,0,1,0,0,0,1,0,0,0]
];

export const anubisBackPalette: Record<number, string> = {
  1: '#3a2a18',    // outline / puntas oscuras
  2: '#F5F5DC',    // cuerpo crema (siamés)
  3: '#4B3621'    // detalle lomo
};

// Anubis de espaldas atacando — patas al frente, zarpazo
export const anubisBackAttack = [
  [0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,1,1,0,1,1,1,0,0],
  [0,1,1,2,2,3,2,2,1,1,0],
  [0,1,2,2,2,2,2,2,2,1,0],
  [1,2,2,2,2,2,2,2,2,2,1],
  [1,2,2,2,2,2,2,2,2,2,1],
  [0,1,2,2,2,2,2,2,2,1,0],
  [0,0,1,2,1,0,1,2,1,0,0],
  [0,0,0,1,0,0,0,1,0,0,0]
];

// Rocco de frente — siamés anciano agresivo, ojos azul siamés
export const roccoFront = [
  [0,1,1,0,0,0,0,0,0,1,1,0],
  [1,3,3,1,0,1,1,0,1,3,3,1],
  [1,3,2,2,1,2,2,1,2,2,3,1],
  [1,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,4,4,2,2,2,2,4,4,2,1],
  [0,1,2,2,3,3,3,3,2,2,1,0],
  [0,1,2,3,5,3,3,5,3,2,1,0],
  [0,0,1,2,3,3,3,3,2,1,0,0],
  [0,0,1,2,2,2,2,2,2,1,0,0],
  [0,1,3,1,1,2,2,1,1,3,1,0]
];

export const roccoFrontPalette: Record<number, string> = {
  1: '#2a1810',    // outline
  2: '#d4b899',    // cuerpo crema oscuro (anciano)
  3: '#1a0e08',    // puntas marrón-negro
  4: '#4ad0ff',    // ojos azul siamés brillante
  5: '#9a2a1a'     // boca gruñendo
};

// Gato callejero de frente (preparado para F3, aún sin usar)
export const streetCatFront = [
  [0,0,0,1,0,0,0,1,0,0,0],
  [0,0,1,3,1,0,1,3,1,0,0],
  [0,1,3,2,2,2,2,2,3,1,0],
  [1,2,2,4,2,2,2,4,2,2,1],
  [1,2,2,2,2,1,2,2,2,2,1],
  [0,1,2,2,2,1,2,2,2,1,0],
  [0,1,2,2,2,2,2,2,2,1,0],
  [0,0,1,2,2,2,2,2,1,0,0],
  [0,0,1,2,1,0,1,2,1,0,0]
];

export const streetCatFrontPalette: Record<number, string> = {
  1: '#1f1f1f',
  2: '#7a7a7a',
  3: '#2a2a2a',
  4: '#ffd24a'
};

// Perro de frente (preparado para F3, aún sin usar)
export const dogFront = [
  [0,0,0,1,1,0,1,1,0,0,0,0],
  [0,0,1,2,2,1,2,2,1,0,0,0],
  [0,1,2,2,2,2,2,2,2,1,0,0],
  [1,2,2,3,2,2,2,3,2,2,1,0],
  [1,2,2,2,2,4,2,2,2,2,1,0],
  [1,2,2,2,1,1,1,2,2,2,1,0],
  [0,1,2,2,2,2,2,2,2,1,0,0],
  [0,1,2,2,2,2,2,2,2,1,0,0],
  [0,1,1,0,1,1,1,1,0,1,1,0]
];

export const dogFrontPalette: Record<number, string> = {
  1: '#3a1a00',
  2: '#a86b3a',
  3: '#000000',
  4: '#ff8866'
};
