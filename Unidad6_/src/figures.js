/**
 * Siluetas dibujadas COMO NUBES DE PUNTOS: cada punto es una meta para un agente.
 * No existen texturas, líneas renderizadas, modelos ni ilustraciones externas.
 * Coordenadas en unidades del mundo de Three.js, centradas en (0,0).
 */
function mulberry32(a) {
  return () => {
    a |= 0; a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function drawer(seed) {
  const rnd = mulberry32(seed);
  const pts = [];
  const point = (x, y, group = 'main', thickness = 0.036) => {
    pts.push({ x: x + (rnd() - 0.5) * thickness, y: y + (rnd() - 0.5) * thickness, group, seed: rnd() });
  };
  const line = (coords, group = 'main', density = 55, width = 0.05) => {
    for (let k = 0; k < coords.length - 1; k++) {
      const [ax, ay] = coords[k], [bx, by] = coords[k + 1];
      const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay) * density));
      for (let i = 0; i < n; i++) {
        const t = i / n;
        point(ax + (bx - ax) * t, ay + (by - ay) * t, group, width);
      }
    }
    if (coords.length) point(...coords[coords.length - 1], group, width);
  };
  const ellipse = (cx, cy, rx, ry, a0 = 0, a1 = Math.PI * 2, group = 'main', density = 55, width = 0.055) => {
    const n = Math.max(8, Math.ceil((a1 - a0) * Math.max(rx, ry) * density));
    for (let k = 0; k <= n; k++) {
      const a = a0 + (a1 - a0) * (k / n);
      point(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, group, width);
    }
  };
  const cloud = (cx, cy, rx, ry, n, group = 'main') => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, radius = Math.sqrt(rnd());
      point(cx + Math.cos(a) * rx * radius, cy + Math.sin(a) * ry * radius, group, 0.04);
    }
  };
  return { line, ellipse, cloud, point, pts };
}

const PI = Math.PI;

function ropeAndKnife(d) {
  // La cuerda y su nudo.
  d.line([[.14, 3.15], [.20, 2.1], [.15, 1.27], [.05, .73], [-.02, .52]], 'rope', 66);
  d.ellipse(-.05, -.08, .49, .80, -PI*.22, PI*1.79, 'rope', 80);
  d.ellipse(-.01, .73, .18, .23, 0, PI*2, 'rope', 52);
  d.line([[-.12, .92], [.12, .70], [-.02, .48]], 'rope', 46);
  // Cuchillo: empuñadura y hoja afilada que avanzan hacia la cuerda.
  d.line([[-2.95, -.42],[-2.21, -.31],[-2.08,-.01],[-1.96,.12],[-2.65,.04],[-2.95,-.42]], 'knife', 64);
  d.line([[-2.08,-.01],[-1.79,.13],[-.12,.80],[.18,.90],[-.75,.24],[-1.96,.12]], 'knife', 76);
  d.line([[-1.69,.11],[-.75,.24],[.18,.90]], 'knife', 45);
  d.cloud(-2.45, -.15, .33, .16, 45, 'knife');
}

function soap(d) {
  d.line([[-1.95,-.63],[-1.35,.13],[.52,.12],[1.15,-.58],[.48,-1.10],[-1.43,-1.06],[-1.95,-.63]], 'soap', 66);
  d.line([[-1.35,.13],[-1.23,-.42],[.50,-.47],[1.15,-.58]], 'soap', 53);
  d.line([[-1.23,-.42],[-1.43,-1.06]], 'soap', 53);
  // 'SOAP' en tipografía geométrica de partículas.
  const ox = -1.02, oy = -.65, h = .31, w = .21, gap = .31;
  const S = [[[w, h],[0,h],[0,h*.52],[w,h*.52],[w,0],[0,0]]];
  const O = [[[0,0],[0,h],[w,h],[w,0],[0,0]]];
  const A = [[[0,0],[0,h],[w,h],[w,0]],[[0,h*.5],[w,h*.5]]];
  const P = [[[0,0],[0,h],[w,h],[w,h*.5],[0,h*.5]]];
  [S,O,A,P].forEach((letter,index) => letter.forEach(path =>
    d.line(path.map(([x,y]) => [ox + gap*index + x, oy+y]), 'soap', 60,.022)));
  const foam = [ [1.22,.27,.28],[1.57,.85,.21],[2.20,1.05,.24],[1.31,1.63,.28],[.64,1.42,.15], [2.53,.36,.18],[-.12,1.16,.15] ];
  foam.forEach(([x,y,r]) => { d.ellipse(x,y,r,r,0,PI*2,'foam',70,.09);d.cloud(x,y,r*.67,r*.67,12,'foam'); });
  d.cloud(1.8,1.23,.9,.65,32,'foam');
}

function childhood(d) {
  // Cabeza: contorno, pelo, rasgos discretos.
  d.ellipse(0,.71,.70,.88,0,PI*2,'child',67);
  d.line([[-.62,1.02],[-.48,1.46],[-.24,1.54],[.07,1.41],[.28,1.58],[.55,1.26]],'child',60);
  d.line([[-.29,.67],[-.11,.67]],'child',55);
  d.line([[.11,.67],[.29,.67]],'child',55);
  d.line([[-.15,.27],[0,.20],[.15,.27]],'child',45);
  // Audífonos sobredimensionados.
  d.ellipse(0,.95,.92,1.08, PI*.08,PI*.92,'headphones',72);
  d.ellipse(-.78,.70,.24,.44,0,PI*2,'headphones',71);
  d.ellipse(.78,.70,.24,.44,0,PI*2,'headphones',71);
  d.line([[-.90,.86],[-.86,.51]],'headphones',70);
  d.line([[.90,.86],[.86,.51]],'headphones',70);
  // Torso, camiseta y brazos cortos.
  d.line([[-.48,-.06],[-.98,-.42],[-1.14,-1.46],[-.74,-1.60],[-.60,-.67],[-.54,-1.85],[.54,-1.85],[.60,-.67],[.74,-1.60],[1.14,-1.46],[.98,-.42],[.48,-.06]],'child',65);
  d.line([[-.48,-.06],[-.17,-.32],[.18,-.32],[.48,-.06]],'child',48);
  d.line([[-.38,-1.43],[.36,-1.43]],'child',42);
  d.cloud(0,-1.00,.35,.50,45,'child');
}

function neckAndHands(d) {
  d.line([[-.56,1.77],[-.45,.61],[-.48,-.55],[-.91,-1.04],[-1.46,-1.22]],'neck',65);
  d.line([[.56,1.77],[.45,.61],[.48,-.55],[.91,-1.04],[1.46,-1.22]],'neck',65);
  d.ellipse(0,1.65,.58,.19,PI*.99,PI*2.03,'neck',62);
  d.line([[-.16,.47],[-.11,-.06]],'neck',50);
  d.line([[.16,.47],[.11,-.06]],'neck',50);
  // Dos manos simplificadas con dedos doblados, dirigidas hacia el cuello.
  d.line([[-2.75,-1.10],[-2.1,-.58],[-1.63,.00],[-1.15,.59],[-.73,.68],[-.57,.52],[-.66,.31],[-1.13,.26]],'left',70);
  d.line([[-2.52,-1.42],[-1.76,-.94],[-1.04,-.40],[-.65,-.10],[-.56,.09],[-.76,.21],[-1.15,.02]],'left',66);
  d.line([[-1.90,-.70],[-1.12,-.30],[-.76,-.24],[-.58,-.33],[-.65,-.52],[-1.16,-.48]],'left',64);
  d.line([[-2.46,-1.35],[-1.96,-1.81],[-1.40,-1.71]],'left',50);
  d.line([[2.75,-1.10],[2.1,-.58],[1.63,.00],[1.15,.59],[.73,.68],[.57,.52],[.66,.31],[1.13,.26]],'right',70);
  d.line([[2.52,-1.42],[1.76,-.94],[1.04,-.40],[.65,-.10],[.56,.09],[.76,.21],[1.15,.02]],'right',66);
  d.line([[1.90,-.70],[1.12,-.30],[.76,-.24],[.58,-.33],[.65,-.52],[1.16,-.48]],'right',64);
  d.line([[2.46,-1.35],[1.96,-1.81],[1.40,-1.71]],'right',50);
  d.cloud(-1.23,-.56,.30,.25,24,'left'); d.cloud(1.23,-.56,.30,.25,24,'right');
}

function devilAndContract(d) {
  // Máscara diabólica: cuernos, mandíbula, ojos y sonrisa.
  d.line([[-1.15,.85],[-1.44,2.05],[-.63,1.46],[0,1.70],[.63,1.46],[1.44,2.05],[1.15,.85]],'mask',70);
  d.line([[-1.15,.85],[-1.22,-.04],[-.77,-.63],[-.27,-.82],[0,-1.02],[.27,-.82],[.77,-.63],[1.22,-.04],[1.15,.85]],'mask',70);
  d.line([[-.93,.69],[-.28,.33],[-.74,.23]],'mask',63);
  d.line([[.93,.69],[.28,.33],[.74,.23]],'mask',63);
  d.line([[-.16,.22],[0,-.03],[.16,.22]],'mask',55);
  d.line([[-.60,-.30],[-.33,-.50],[0,-.55],[.33,-.50],[.60,-.30]],'mask',65);
  d.line([[-.32,-.48],[-.23,-.69],[-.10,-.50]],'mask',60);
  d.line([[.32,-.48],[.23,-.69],[.10,-.50]],'mask',60);
  d.cloud(-.63,.68,.22,.1,22,'mask'); d.cloud(.63,.68,.22,.1,22,'mask');
  // Documento inclinado, dejando espacio visual bajo la máscara.
  d.line([[-2.1,-1.20],[.20,-1.28],[.42,-2.41],[-1.89,-2.35],[-2.1,-1.20]],'paper',64);
  d.line([[-1.77,-1.51],[-.28,-1.56]],'paper',48);
  d.line([[-1.74,-1.79],[-.47,-1.82]],'paper',48);
  d.line([[-1.68,-2.11],[-1.11,-2.14],[-.85,-2.06],[-.59,-2.18]],'paper',52);
  // Bolígrafo diagonal, con punta que "firma" la hoja.
  d.line([[.57,-2.11],[1.98,-.94],[2.18,-1.17],[.79,-2.32],[.57,-2.11]],'pen',62);
  d.line([[.79,-2.32],[.43,-2.45],[.57,-2.11]],'pen',60);
  d.line([[1.98,-.94],[2.07,-.68],[2.30,-.92],[2.18,-1.17]],'pen',50);
}

export const SCENES = {
  1: { name: 'LA MENTE', subtitle: 'Campo de flujo autónomo', seed: 0 },
  2: { name: 'LA CUERDA', subtitle: 'Ruptura y liberación', seed: 21, create: ropeAndKnife },
  3: { name: 'PURIFICACIÓN', subtitle: 'El jabón equivocado', seed: 31, create: soap },
  4: { name: 'LA INFANCIA', subtitle: 'El recuerdo de los audífonos', seed: 41, create: childhood },
  5: { name: 'ASFIXIA', subtitle: 'La presión interior', seed: 51, create: neckAndHands },
  6: { name: 'EL PACTO', subtitle: 'Contrato e identidad', seed: 61, create: devilAndContract },
};

export function figurePoints(number) {
  const scene = SCENES[number];
  if (!scene?.create) return [];
  const d = drawer(scene.seed);
  scene.create(d);
  // Mantener un presupuesto controlado: submuestreo para máquinas modestas.
  const MAX = 870;
  if (d.pts.length <= MAX) return d.pts;
  const stride = d.pts.length / MAX;
  return Array.from({ length: MAX }, (_, i) => d.pts[Math.floor(i * stride)]);
}
