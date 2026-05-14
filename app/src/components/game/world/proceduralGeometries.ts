/**
 * Процедурные составные геометрии для мира (без внешних GLB) — «NMS-подобная» плотность форм.
 * Каждая фабрика возвращает BufferGeometry; вызывающий обязан .dispose() при размонтировании.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function mergeAndDisposeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  return merged;
}

/** Крупное «инопланетное» дерево: ствол + ветви + крона. */
export function createAlienTreeGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const trunk = new THREE.CylinderGeometry(0.1, 0.2, 1.05, 7, 2, false);
  trunk.translate(0, 0.52, 0);
  parts.push(trunk);
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2;
    const branch = new THREE.ConeGeometry(0.28 + (i % 3) * 0.06, 1.15, 6, 2);
    branch.rotateZ(0.38 + (i % 2) * 0.12);
    branch.translate(Math.cos(ang) * 0.22, 0.72 + (i % 2) * 0.35, Math.sin(ang) * 0.22);
    parts.push(branch);
  }
  const crown = new THREE.IcosahedronGeometry(0.48, 1);
  crown.scale(1.15, 0.72, 1.1);
  crown.translate(0, 1.72, 0);
  parts.push(crown);
  return mergeAndDisposeParts(parts);
}

/** Скальный выступ из нескольких «камней». */
export function createRockClusterGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const a = new THREE.DodecahedronGeometry(0.42, 0);
  a.scale(1.35, 0.72, 0.95);
  a.rotateY(0.7);
  a.translate(0, 0.32, 0);
  parts.push(a);
  const b = new THREE.DodecahedronGeometry(0.28, 0);
  b.scale(0.9, 1.1, 0.85);
  b.rotateZ(0.35);
  b.translate(0.38, 0.18, 0.12);
  parts.push(b);
  const c = new THREE.TetrahedronGeometry(0.26, 0);
  c.rotateX(0.9);
  c.translate(-0.32, 0.1, -0.18);
  parts.push(c);
  return mergeAndDisposeParts(parts);
}

/** Кластер кристаллов. */
export function createCrystalClusterGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const main = new THREE.OctahedronGeometry(0.52, 0);
  main.translate(0, 0.55, 0);
  parts.push(main);
  const s1 = new THREE.OctahedronGeometry(0.22, 0);
  s1.translate(0.35, 0.25, 0.1);
  parts.push(s1);
  const s2 = new THREE.OctahedronGeometry(0.18, 0);
  s2.translate(-0.28, 0.18, -0.22);
  parts.push(s2);
  return mergeAndDisposeParts(parts);
}

/** Крест из плоскостей — трава / низкая растительность. */
export function createGrassBillboardGeometry(): THREE.BufferGeometry {
  const a = new THREE.PlaneGeometry(0.55, 0.38);
  const b = a.clone();
  b.rotateY(Math.PI / 2);
  return mergeAndDisposeParts([a, b]);
}

/** Гриб: ножка + шляпка. */
export function createMushroomGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const stem = new THREE.CylinderGeometry(0.08, 0.12, 0.42, 6, 1, false);
  stem.translate(0, 0.21, 0);
  parts.push(stem);
  const cap = new THREE.SphereGeometry(0.26, 8, 6, 0, Math.PI / 2, 0, Math.PI * 2);
  cap.scale(1.05, 0.75, 1.05);
  cap.translate(0, 0.48, 0);
  parts.push(cap);
  return mergeAndDisposeParts(parts);
}

/** Колонна руин. */
export function createRuinPillarGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const col = new THREE.BoxGeometry(0.55, 2.4, 0.55);
  col.translate(0, 1.2, 0);
  parts.push(col);
  const cap = new THREE.BoxGeometry(0.72, 0.22, 0.72);
  cap.translate(0, 2.45, 0);
  parts.push(cap);
  const chip = new THREE.BoxGeometry(0.35, 0.5, 0.4);
  chip.rotateZ(0.35);
  chip.translate(0.38, 1.85, 0);
  parts.push(chip);
  return mergeAndDisposeParts(parts);
}

/** Плато-меза (пустыня). */
export function createMesaGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.ConeGeometry(1.6, 1.35, 7, 1, false);
  base.scale(1, 0.85, 1);
  base.translate(0, 0.55, 0);
  parts.push(base);
  const top = new THREE.CylinderGeometry(1.05, 1.15, 0.35, 8, 1, false);
  top.translate(0, 1.15, 0);
  parts.push(top);
  return mergeAndDisposeParts(parts);
}

/** Sci-fi обелиск с кольцом. */
export function createTechObeliskGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const core = new THREE.CylinderGeometry(0.22, 0.38, 2.8, 8, 2, false);
  core.translate(0, 1.4, 0);
  parts.push(core);
  const ring = new THREE.TorusGeometry(0.55, 0.06, 8, 32);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, 1.85, 0);
  parts.push(ring);
  const tip = new THREE.ConeGeometry(0.15, 0.55, 6, 1);
  tip.translate(0, 2.95, 0);
  parts.push(tip);
  return mergeAndDisposeParts(parts);
}

/** Летающий осколок: ядро + шипы. */
export function createFloatingShardGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const core = new THREE.IcosahedronGeometry(0.38, 1);
  parts.push(core);
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const spike = new THREE.ConeGeometry(0.12, 0.55, 4, 1);
    spike.rotateZ(-Math.PI / 2);
    spike.translate(Math.cos(ang) * 0.35, Math.sin(ang * 1.7) * 0.08, Math.sin(ang) * 0.35);
    parts.push(spike);
  }
  return mergeAndDisposeParts(parts);
}

/** Низкая постройка / модуль (современность). */
export function createHabPodGeometry(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const base = new THREE.BoxGeometry(1.1, 0.55, 1.0);
  base.translate(0, 0.28, 0);
  parts.push(base);
  const upper = new THREE.BoxGeometry(0.85, 0.45, 0.85);
  upper.translate(0, 0.78, 0);
  parts.push(upper);
  const dish = new THREE.CylinderGeometry(0.12, 0.18, 0.08, 8, 1, false);
  dish.translate(0.35, 0.95, 0.35);
  parts.push(dish);
  return mergeAndDisposeParts(parts);
}
