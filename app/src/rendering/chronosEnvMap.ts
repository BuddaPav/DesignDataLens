import * as THREE from 'three';

/** Процедурный cube env (cyan / violet / aurora) — отражения для металла и воды без CubeCamera. */
export function createChronosCubeEnv(): THREE.CubeTexture {
  const size = 96;
  const gradients: [string, string][] = [
    ['#010409', '#111827'],
    ['#030712', '#312e81'],
    ['#020617', '#134e4a'],
    ['#0f0720', '#581c87'],
    ['#082f49', '#67e8f9'],
    ['#020617', '#155e75']
  ];
  const images: HTMLCanvasElement[] = [];
  for (let f = 0; f < 6; f++) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    const [a, b] = gradients[f % gradients.length];
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, a);
    g.addColorStop(0.55, b);
    g.addColorStop(1, '#66fcf1');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 55; i++) {
      const tw = 1 + (i % 3);
      ctx.fillStyle = `hsl(${210 + (f * 9 + i * 5) % 100}, 72%, ${38 + (i % 6) * 7}%)`;
      ctx.fillRect((i * 19) % size, (i * 29 + f * 7) % size, tw, tw);
    }
    images.push(c);
  }
  const tex = new THREE.CubeTexture(images);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
