# SPINELESS — Unidad 6 · Agentes autónomos

**Instrumento visual en vivo con Three.js + Vite para interpretar «Spineless» de Terror Reid.**

El escenario es un círculo elíptico de partículas autónomas que consulta un **campo de flujo** y combina **separación, alineación y cohesión** (flocking). El cursor altera las fuerzas locales. Mediante el teclado, el intérprete activa seis escenas (una base + cinco símbolos de la letra). **Las escenas no se disparan solas**, independientemente de que el audio se esté analizando.

## Instalar y ejecutar

En la carpeta raíz, donde está `package.json`:

```bash
npm install
npm run dev
```

Abre la URL que indique Vite (normalmente `http://localhost:5173`). Para comprobar producción:

```bash
npm run build
npm run preview
```

Recomendado: Node.js **20.19 o posterior**, o Node.js 22. Vite 6 también admite varias versiones anteriores de Node 20.

## Controles

| Control | Acción |
| --- | --- |
| `1` | Escenario base: mente / círculo |
| `2` | Cuerda y cuchillo; tras el corte se disgrega |
| `3` | Jabón y espuma |
| `4` | Niño y audífonos |
| `5` | Manos sobre el cuello |
| `6` | Máscara, contrato y bolígrafo |
| `B` | Invertir blanco/negro |
| `H` | Ocultar o mostrar la interfaz |
| `F` | Entrar o salir de pantalla completa |
| `Espacio` | Pausar/reproducir archivo musical local |
| `Mouse` | Modificar localmente el flujo y dejar estelas |

Cada evento dura **2 segundos** antes de iniciar un **desvanecimiento de 0.5 segundos**. Si pulsas otra tecla de evento antes, el anterior comienza a desvanecerse de inmediato durante 0.5 segundos, mientras el nuevo se forma. El escenario de fondo nunca se detiene.

## Reactividad musical

Tienes tres opciones:

1. **Cargar archivo:** selecciona o arrastra un MP3, WAV, OGG, etc. El audio se reproduce desde tu computadora; no se sube a ningún servidor.
2. **Audio de pestaña:** reproduce la canción en una pestaña de YouTube y pulsa **AUDIO DE PESTAÑA**. Selecciona esa pestaña y marca **Compartir audio**. Funciona mejor en Chrome o Edge en escritorio (requiere `localhost` o HTTPS y permisos del navegador). *No todos los navegadores o sistemas capturan el audio de una pestaña.*
3. **MIC:** usa el micrófono como alternativa; evita ponerlo cerca de los altavoces si molesta la retroalimentación.

**Nota:** YouTube no es una fuente de audio directamente descargable por la app. La captura de pestaña lee audio solo después de la autorización manual del usuario. La app no incluye ni distribuye la canción.

La energía en **graves** cambia el tamaño y el pulso de los agentes, en **medios** aumenta la velocidad y la turbulencia del campo, y en **agudos** afecta intensidad visual/vibración. **La música no activa eventos automáticamente.** La persona mantiene el control de la interpretación.

## Cómo defenderlo (Unidad 6)

- **Percepción limitada:** cada partícula base consulta la dirección del campo en su posición, considera hasta 12 vecinos próximos de una rejilla espacial, y responde al mouse solo a corta distancia.
- **Cálculo de steering:** combina una velocidad deseada del campo, separación, alineación, cohesión y una fuerza suave de retorno al anillo. La aceleración y velocidad tienen límites.
- **Flocking:** separación evita aglomeraciones, alineación coordina velocidades y cohesión mantiene vecindades. No existe un agente líder.
- **Flow fields:** rejilla de vectores que se actualiza de forma continua; los agentes consultan su dirección mediante interpolación y transforman esa dirección en steering. La música modula su turbulencia, sin imponer posiciones.
- **Eventos:** se asignan destinos a agentes de figura para que se reorganicen con steering y formen siluetas hechas exclusivamente de puntos. Al finalizar, siguen el campo y pierden opacidad.
- **Performance humana:** teclado + cursor + inversión de contraste. Sin secuencia automática ni BPM preprogramado.
- **Estelas:** partículas residuales con vida limitada. **No son una implementación de Physarum.** Utilizamos steering, flocking y flow fields, que son tres familias permitidas por el encargo.

## Publicar con GitHub Actions

El workflow está en `.github/workflows/deploy.yml`. Se ejecuta al hacer `push` a `main` o `master`, o manualmente desde **Actions**.

1. Copia los archivos de este ZIP **a la raíz de tu repositorio `Unidad6Prototipo`**, sin borrar tus carpetas `Composición`, `ImagenesStoryboard`, `Lyrics.md` o `StoryBoard.md`.
2. Abre terminal y ejecuta `npm install` para generar el `package-lock.json` local.
3. Haz `git add .`, `git commit -m "Unidad 6 - instrumento visual Three.js"`, y `git push`.
4. En GitHub entra al repositorio → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
5. En **Actions** consulta la ejecución de “Publicar SPINELESS en GitHub Pages”. Una vez publicada, el enlace de Pages aparece en el entorno de deploy y en Settings → Pages.

`vite.config.js` deduce automáticamente la ruta base del nombre del repositorio en GitHub Actions. No tienes que cambiarla manualmente.

## Estructura

```text
Unidad6Prototipo/
├── .github/workflows/deploy.yml
├── src/
│   ├── main.js         # interacción UI / teclado / performance
│   ├── visual.js       # renderer, agentes, flow field, flocking, eventos
│   ├── figures.js      # formas creadas por puntos
│   ├── audio.js        # archivo, pestaña, micrófono, Web Audio API
│   └── style.css
├── index.html
├── vite.config.js
├── package.json
├── .gitignore
└── README.md
```

### Mantén tu documentación

Tus archivos `Lyrics.md`, `StoryBoard.md`, carpeta `Composición/` e `ImagenesStoryboard/` no vienen en el ZIP porque no fueron adjuntados como archivos aquí. El código no sobrescribe ninguno.

### Rendimiento

Es un renderizado de WebGL con aproximadamente 1.750 agentes para el círculo (1.050 en pantallas pequeñas), y un máximo de ~870 agentes por evento, con una búsqueda de vecinos basada en rejilla en lugar de comparaciones cuadráticas. Se limita el pixel ratio a 2. Si necesitas aún menos consumo, reduce `this.baseCount` en `src/visual.js`.

**Créditos:** prototipo pedagógico inspirado en los algoritmos de agentes autónomos descritos en *The Nature of Code* y Craig Reynolds. La estética y los símbolos se derivan del storyboard de la actividad, no de imágenes precargadas.
