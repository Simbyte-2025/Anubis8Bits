# Anubis Escape

Juego de plataformas 8-bit protagonizado por **Anubis**, una gata siamesa que escapa por los tejados del barrio. Se juega en el navegador del celular (en horizontal), se puede instalar como app y funciona sin conexión.

## Jugar

- Producción: se publica automáticamente en Cloudflare Pages (proyecto `kitten-jump`) en cada push a `main`.
- En iPhone/iPad: abrir el enlace en Safari → Compartir → **Añadir a pantalla de inicio** para jugar a pantalla completa.

## Contenido

- 5 niveles: La Fuga, El Vecindario, Los Callejones, Los Tejados y El cuarto de Rocco.
- Banderas de control: al pasarlas, si Anubis cae vuelve ahí y no al inicio.
- Enemigos (murciélagos, escarabajos, gatos callejeros, perros) y Rocco, que duerme: hay que pasar en sigilo 🤫 o pelear con él.
- Power-ups: doble salto, escudo, vida extra y caja de cartón (los perros no la ven).
- Ajustes: velocidad (tranquilo/normal/rápido), **vidas infinitas**, tipo de controles táctiles y sonido.

## Desarrollo

```bash
npm install
npm run dev      # servidor local en http://localhost:3000
npm test         # tests del motor, niveles y bucle de tiempo
npm run lint     # chequeo de tipos
npm run build    # build de producción en dist/
```

### Arquitectura

- `src/game/engine.ts` — física, colisiones, enemigos, cámara y dibujo en Canvas 2D.
- `src/game/levels.ts` — niveles como datos (plataformas, monedas, enemigos, banderas, meta).
- `src/game/loop.ts` — paso de tiempo fijo (60 pasos/s), igual en pantallas de 60, 90 o 120 Hz.
- `src/game/battle/` — modo batalla tipo Punch-Out.
- `src/game/sprites.ts` — sprites pixel art definidos como matrices de paleta.
- `src/App.tsx` — bucle, ajuste a pantalla (altura lógica 600, ancho según proporción) y menús en React.
