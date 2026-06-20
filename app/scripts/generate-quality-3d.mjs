#!/usr/bin/env node
/**
 * Quality 3D Model Generator
 *
 * Generates actual game-ready GLB models with proper geometry:
 * - Trees: trunk cylinder + cone/sphere foliage
 * - Rocks: icosahedron variations
 * - Crystals: octahedron clusters
 * - Buildings: box + pyramid roofs
 * - Props: cylinders, boxes, toruses
 *
 * Run: node scripts/generate-quality-3d.mjs
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(__dirname, '..');
const modelsRoot = join(appRoot, 'public', 'models', 'aaa', 'quality');

const LOD_COUNT = 3;

// =============================================================================
// GEOMETRY PRIMITIVES
// =============================================================================

function createBox(width = 1, height = 1, depth = 1) {
  const hw = width / 2, hh = height / 2, hd = depth / 2;
  const positions = [
    // Front
    -hw, -hh,  hd,   hw, -hh,  hd,   hw,  hh,  hd,  -hw,  hh,  hd,
    // Back
     hw, -hh, -hd,  -hw, -hh, -hd,  -hw,  hh, -hd,   hw,  hh, -hd,
    // Top
    -hw,  hh,  hd,   hw,  hh,  hd,   hw,  hh, -hd, -hw,  hh, -hd,
    // Bottom
    -hw, -hh, -hd,   hw, -hh, -hd,   hw, -hh,  hd, -hw, -hh,  hd,
    // Right
     hw, -hh,  hd,   hw, -hh, -hd,   hw,  hh, -hd,   hw,  hh,  hd,
    // Left
    -hw, -hh, -hd,  -hw, -hh,  hd,  -hw,  hh,  hd, -hw,  hh, -hd,
  ];
  const indices = [];
  for (let face = 0; face < 6; face++) {
    const base = face * 4;
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // Normals (simplified - all faces have their own normal)
  const normals = [];
  for (const [nx, ny, nz] of [
    [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0]
  ]) {
    for (let i = 0; i < 4; i++) normals.push(nx, ny, nz);
  }
  return { positions, indices, normals };
}

function createCylinder(radius = 0.5, height = 1, segments = 12) {
  const positions = [];
  const indices = [];
  const normals = [];
  const hh = height / 2;

  // Side vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const nx = Math.cos(angle);
    const nz = Math.sin(angle);
    // Bottom
    positions.push(x, -hh, z);
    normals.push(nx, 0, nz);
    // Top
    positions.push(x, hh, z);
    normals.push(nx, 0, nz);
  }
  // Side indices
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    indices.push(a, c, b, b, c, d);
  }
  // Top cap
  const topCenter = positions.length / 3;
  positions.push(0, hh, 0);
  normals.push(0, 1, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, hh, Math.sin(angle) * radius);
    normals.push(0, 1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(topCenter, topCenter + i + 1, topCenter + i + 2);
  }
  // Bottom cap
  const botCenter = positions.length / 3;
  positions.push(0, -hh, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, -hh, Math.sin(angle) * radius);
    normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(botCenter, botCenter + i + 2, botCenter + i + 1);
  }
  return { positions, indices, normals };
}

function createCone(radius = 0.5, height = 1, segments = 12) {
  const positions = [];
  const indices = [];
  const normals = [];
  const hh = height;

  // Tip
  positions.push(0, hh, 0);
  normals.push(0, 1, 0);
  // Base vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    positions.push(x, 0, z);
    // Approximate normal
    const ny = radius / height;
    const len = Math.sqrt(1 + ny * ny);
    normals.push(Math.cos(angle) / len, ny / len, Math.sin(angle) / len);
  }
  // Side indices
  for (let i = 1; i <= segments; i++) {
    indices.push(0, i, i + 1);
  }
  // Bottom cap
  const baseStart = positions.length / 3;
  positions.push(0, 0, 0);
  normals.push(0, -1, 0);
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
    normals.push(0, -1, 0);
  }
  for (let i = 1; i <= segments; i++) {
    indices.push(baseStart, baseStart + i + 1, baseStart + i);
  }
  return { positions, indices, normals };
}

function createIcosahedron(radius = 1) {
  const t = (1 + Math.sqrt(5)) / 2;
  const positions = [];
  const indices = [];
  const normals = [];

  const verts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
  ];

  const scale = radius / t;

  for (const v of verts) {
    const len = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
    positions.push(v[0] * scale, v[1] * scale, v[2] * scale);
    normals.push(v[0]/len, v[1]/len, v[2]/len);
  }

  const faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];

  for (const f of faces) {
    indices.push(...f);
  }

  return { positions, indices, normals };
}

function createOctahedron(radius = 1) {
  const positions = [
    0, radius, 0,   radius, 0, 0,   0, 0, radius,  -radius, 0, 0,   0, 0, -radius,  0, -radius, 0
  ];
  const indices = [
    0, 1, 2,   0, 2, 3,   0, 3, 4,   0, 4, 1,
    5, 2, 1,   5, 3, 2,   5, 4, 3,   5, 1, 4
  ];
  const normals = [];
  for (let i = 0; i < positions.length; i += 3) {
    const len = Math.sqrt(positions[i]**2 + positions[i+1]**2 + positions[i+2]**2) || 1;
    normals.push(positions[i]/len, positions[i+1]/len, positions[i+2]/len);
  }
  return { positions, indices, normals };
}

function createSphere(radius = 1, latSegments = 8, lonSegments = 12) {
  const positions = [];
  const indices = [];
  const normals = [];

  for (let lat = 0; lat <= latSegments; lat++) {
    const theta = (lat / latSegments) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);

    for (let lon = 0; lon <= lonSegments; lon++) {
      const phi = (lon / lonSegments) * Math.PI * 2;
      const x = Math.cos(phi) * sinTheta;
      const y = cosTheta;
      const z = Math.sin(phi) * sinTheta;

      positions.push(x * radius, y * radius, z * radius);
      normals.push(x, y, z);
    }
  }

  for (let lat = 0; lat < latSegments; lat++) {
    for (let lon = 0; lon < lonSegments; lon++) {
      const a = lat * (lonSegments + 1) + lon;
      const b = a + lonSegments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return { positions, indices, normals };
}

function createTorus(R = 0.7, r = 0.25, segments = 16, rings = 24) {
  const positions = [];
  const indices = [];
  const normals = [];

  for (let i = 0; i <= rings; i++) {
    const u = (i / rings) * Math.PI * 2;
    const cu = Math.cos(u), su = Math.sin(u);

    for (let j = 0; j <= segments; j++) {
      const v = (j / segments) * Math.PI * 2;
      const cv = Math.cos(v), sv = Math.sin(v);

      const x = (R + r * cv) * cu;
      const y = r * sv;
      const z = (R + r * cv) * su;

      positions.push(x, y, z);

      const nx = cv * cu;
      const ny = sv;
      const nz = cv * su;
      normals.push(nx, ny, nz);
    }
  }

  for (let i = 0; i < rings; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  return { positions, indices, normals };
}

// =============================================================================
// ASSET DEFINITIONS
// =============================================================================

const ASSETS = {
  // Trees
  tree_pine: {
    create: (lod) => {
      const trunkH = 0.8, trunkR = 0.12;
      const foliageR = lod === 0 ? 0.7 : lod === 1 ? 0.55 : 0.4;
      const foliageH = lod === 0 ? 1.4 : lod === 1 ? 1.1 : 0.8;
      return mergeMeshes([
        { mesh: createCylinder(trunkR, trunkH, lod === 0 ? 12 : 8), offset: [0, trunkH/2, 0], color: [0.4, 0.25, 0.15, 1] },
        { mesh: createCone(foliageR, foliageH, lod === 0 ? 12 : 8), offset: [0, trunkH + foliageH/2 - 0.1, 0], color: [0.15, 0.35, 0.12, 1] },
        { mesh: createCone(foliageR * 0.75, foliageH * 0.7, 8), offset: [0, trunkH + foliageH * 0.85, 0], color: [0.12, 0.32, 0.1, 1] }
      ]);
    }
  },
  tree_oak: {
    create: (lod) => {
      const trunkH = 0.7, trunkR = 0.15;
      const foliageR = lod === 0 ? 0.9 : lod === 1 ? 0.7 : 0.5;
      return mergeMeshes([
        { mesh: createCylinder(trunkR, trunkH, 10), offset: [0, trunkH/2, 0], color: [0.45, 0.3, 0.18, 1] },
        { mesh: createSphere(foliageR, lod === 0 ? 8 : 6, 10), offset: [0, trunkH + foliageR * 0.6, 0], color: [0.2, 0.45, 0.15, 1] },
        { mesh: createSphere(foliageR * 0.7, 6, 8), offset: [0.2, trunkH + foliageR * 0.4, 0.15], color: [0.18, 0.42, 0.12, 1] },
        { mesh: createSphere(foliageR * 0.6, 5, 6), offset: [-0.15, trunkH + foliageR * 0.5, -0.1], color: [0.22, 0.48, 0.18, 1] }
      ]);
    }
  },
  tree_dead: {
    create: (lod) => {
      const h = 1.2, r = 0.1;
      return {
        mesh: createCylinder(r, h, lod === 0 ? 8 : 6),
        offset: [0, h/2, 0],
        color: [0.35, 0.28, 0.2, 1]
      };
    }
  },

  // Rocks
  rock_large: {
    create: (lod) => {
      const segments = lod === 0 ? 3 : 2;
      return mergeMeshes([
        { mesh: createIcosahedron(0.6), offset: [0, 0.35, 0], color: [0.45, 0.42, 0.38, 1] },
        { mesh: createIcosahedron(0.35), offset: [0.25, 0.15, 0.2], color: [0.5, 0.46, 0.4, 1] },
        { mesh: createIcosahedron(0.25), offset: [-0.2, 0.1, 0.15], color: [0.4, 0.38, 0.35, 1] }
      ]);
    }
  },
  rock_small: {
    create: (lod) => {
      return createIcosahedron(lod === 0 ? 0.3 : lod === 1 ? 0.22 : 0.15);
    }
  },

  // Crystals
  crystal_blue: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createOctahedron(0.5), offset: [0, 0.4, 0], color: [0.2, 0.4, 0.9, 1] },
        { mesh: createOctahedron(0.3), offset: [0.15, 0.15, 0.1], color: [0.3, 0.5, 0.95, 1] }
      ]);
    }
  },
  crystal_purple: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createOctahedron(0.55), offset: [0, 0.45, 0], color: [0.5, 0.2, 0.7, 1] },
        { mesh: createOctahedron(0.25), offset: [-0.12, 0.2, 0.08], color: [0.65, 0.3, 0.85, 1] }
      ]);
    }
  },
  crystal_green: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createOctahedron(0.45), offset: [0, 0.35, 0], color: [0.15, 0.6, 0.3, 1] },
        { mesh: createOctahedron(0.2), offset: [0.1, 0.12, 0], color: [0.25, 0.75, 0.4, 1] }
      ]);
    }
  },

  // Buildings
  building_tower: {
    create: (lod) => {
      const baseW = 0.8, baseH = 1.5, roofH = 0.5;
      return mergeMeshes([
        { mesh: createBox(baseW, baseH, baseW), offset: [0, baseH/2, 0], color: [0.5, 0.48, 0.45, 1] },
        { mesh: createCone(baseW * 0.7, roofH, lod === 0 ? 8 : 6), offset: [0, baseH + roofH/2, 0], color: [0.4, 0.35, 0.3, 1] }
      ]);
    }
  },
  building_house: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createBox(1, 0.8, 0.8), offset: [0, 0.4, 0], color: [0.55, 0.45, 0.35, 1] },
        { mesh: createCone(0.7, 0.5, 6), offset: [0, 0.8 + 0.25, 0], color: [0.35, 0.25, 0.2, 1] }
      ]);
    }
  },

  // Props
  barrel: {
    create: (lod) => {
      const h = 0.7, r = 0.2;
      return createCylinder(r, h, lod === 0 ? 12 : 8);
    }
  },
  crate: {
    create: (lod) => {
      const s = lod === 0 ? 0.5 : lod === 1 ? 0.4 : 0.3;
      return createBox(s, s, s);
    }
  },
  campfire: {
    create: (lod) => {
      const logs = [];
      for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        logs.push({
          mesh: createCylinder(0.08, 0.5, 6),
          offset: [Math.cos(angle) * 0.2, 0.15, Math.sin(angle) * 0.2],
          rotation: [0, angle, 0.3],
          color: [0.3, 0.2, 0.1, 1]
        });
      }
      // Add fire (simple glow)
      logs.push({
        mesh: createCone(0.15, 0.3, 6),
        offset: [0, 0.35, 0],
        color: [0.9, 0.4, 0.1, 1]
      });
      return mergeMeshes(logs);
    }
  },
  lantern: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createCylinder(0.05, 0.5, 6), offset: [0, 0.25, 0], color: [0.3, 0.25, 0.2, 1] },
        { mesh: createSphere(0.1, 4, 6), offset: [0, 0.55, 0], color: [0.95, 0.85, 0.5, 1] }
      ]);
    }
  },
  boulder: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createIcosahedron(0.5), offset: [0, 0.35, 0], color: [0.42, 0.4, 0.38, 1] },
        { mesh: createIcosahedron(0.3), offset: [0.2, 0.15, 0.15], color: [0.45, 0.42, 0.4, 1] }
      ]);
    }
  },
  stump: {
    create: (lod) => {
      const h = 0.4, r = 0.25;
      return createCylinder(r, h, lod === 0 ? 10 : 8);
    }
  },
  mushroom: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createCylinder(0.08, 0.25, 6), offset: [0, 0.125, 0], color: [0.85, 0.75, 0.65, 1] },
        { mesh: createSphere(0.2, 4, 6), offset: [0, 0.3, 0], color: [0.75, 0.2, 0.15, 1] }
      ]);
    }
  },
  signpost: {
    create: (lod) => {
      return mergeMeshes([
        { mesh: createCylinder(0.05, 0.8, 6), offset: [0, 0.4, 0], color: [0.45, 0.3, 0.2, 1] },
        { mesh: createBox(0.3, 0.25, 0.05), offset: [0, 0.65, 0], color: [0.5, 0.35, 0.22, 1], rotation: [0, 0.2, 0] }
      ]);
    }
  }
};

function mergeMeshes(parts) {
  if (!Array.isArray(parts)) parts = [parts];
  const allPositions = [];
  const allIndices = [];
  const allNormals = [];
  let indexOffset = 0;

  for (const part of parts) {
    let { positions, indices, normals } = part.mesh;
    const offset = part.offset || [0, 0, 0];
    const rotation = part.rotation || [0, 0, 0];

    // Apply rotation
    let rotated = [];
    if (rotation[0] || rotation[1] || rotation[2]) {
      const cx = Math.cos(rotation[0]), sx = Math.sin(rotation[0]);
      const cy = Math.cos(rotation[1]), sy = Math.sin(rotation[1]);
      const cz = Math.cos(rotation[2]), sz = Math.sin(rotation[2]);

      for (let i = 0; i < positions.length; i += 3) {
        let x = positions[i], y = positions[i+1], z = positions[i+2];
        // Rotate Y
        let x1 = x * cy - z * sy, z1 = x * sy + z * cy;
        // Rotate X
        let y1 = y * cx - z1 * sx, z2 = y * sx + z1 * cx;
        // Rotate Z
        let x2 = x1 * cz - y1 * sz, y2 = x1 * sz + y1 * cz;
        rotated.push(x2 + offset[0], y2 + offset[1], z2 + offset[2]);
      }
      positions = rotated;
    } else {
      for (let i = 0; i < positions.length; i += 3) {
        rotated.push(positions[i] + offset[0], positions[i+1] + offset[1], positions[i+2] + offset[2]);
      }
    }

    allPositions.push(...positions);
    allIndices.push(...indices.map(i => i + indexOffset));
    allNormals.push(...(normals || []));
    indexOffset += positions.length / 3;
  }

  return { positions: allPositions, indices: allIndices, normals: allNormals };
}

// =============================================================================
// GLTF EXPORT
// =============================================================================

function align4(n) { return Math.ceil(n / 4) * 4; }

function createGltf(name, geometry, color) {
  const { positions, indices, normals } = geometry;
  const positionArray = new Float32Array(positions);
  const indexArray = new Uint16Array(indices);

  // Generate normals if missing
  let normalData = normals;
  if (!normalData || normalData.length < positions.length) {
    normalData = [];
    for (let i = 0; i < positions.length; i += 3) {
      normalData.push(0, 1, 0); // Default up
    }
  }
  const normalArray = new Float32Array(normalData);

  const indicesBuffer = Buffer.from(indexArray.buffer);
  const positionBuffer = Buffer.from(positionArray.buffer);
  const normalBuffer = Buffer.from(normalArray.buffer);

  const indicesOffset = 0;
  const positionsOffset = align4(indicesBuffer.length);
  const normalsOffset = align4(positionsOffset + positionBuffer.length);
  const totalLength = align4(normalsOffset + normalBuffer.length);

  const binary = Buffer.alloc(totalLength, 0);
  indicesBuffer.copy(binary, indicesOffset);
  positionBuffer.copy(binary, positionsOffset);
  normalBuffer.copy(binary, normalsOffset);

  // Calculate bounding box
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3) {
    for (let a = 0; a < 3; a++) {
      min[a] = Math.min(min[a], positions[i + a]);
      max[a] = Math.max(max[a], positions[i + a]);
    }
  }

  const gltf = {
    asset: { version: '2.0', generator: 'chronos-quality-3d' },
    scene: 0,
    scenes: [{ name, nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [{
      name: `${name}_mesh`,
      primitives: [{
        attributes: { POSITION: 1, NORMAL: 2 },
        indices: 0,
        material: 0,
        mode: 4
      }]
    }],
    materials: [{
      name: `${name}_mat`,
      pbrMetallicRoughness: {
        baseColorFactor: color || [0.5, 0.5, 0.5, 1],
        metallicFactor: 0.1,
        roughnessFactor: 0.8
      }
    }],
    accessors: [
      {
        bufferView: 0, componentType: 5123, count: indexArray.length,
        type: 'SCALAR', max: [Math.max(...indices)], min: [0]
      },
      {
        bufferView: 1, componentType: 5126, count: positionArray.length / 3,
        type: 'VEC3', min, max
      },
      {
        bufferView: 2, componentType: 5126, count: normalArray.length / 3,
        type: 'VEC3'
      }
    ],
    bufferViews: [
      { buffer: 0, byteOffset: indicesOffset, byteLength: indicesBuffer.length, target: 34963 },
      { buffer: 0, byteOffset: positionsOffset, byteLength: positionBuffer.length, target: 34962 },
      { buffer: 0, byteOffset: normalsOffset, byteLength: normalBuffer.length, target: 34962 }
    ],
    buffers: [{
      byteLength: totalLength,
      uri: `data:application/octet-stream;base64,${binary.toString('base64')}`
    }]
  };

  return gltf;
}

function padded(i, len = 4) { return String(i).padStart(len, '0'); }

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  await mkdir(modelsRoot, { recursive: true });

  const count = Number.parseInt(process.env.CHRONOS_QUALITY_COUNT || '', 10) || Object.keys(ASSETS).length;

  console.log(`[generate-quality-3d] Generating ${count} quality models...`);

  let generated = 0;
  const entries = [];

  for (const [name, asset] of Object.entries(ASSETS)) {
    for (let lod = 0; lod < LOD_COUNT; lod++) {
      let geometry = asset.create(lod);
      const color = geometry?.color || [0.5, 0.5, 0.5, 1];
      // Handle if returned object has different structure
      if (!geometry?.positions) {
        // It might be the raw mesh object
        console.log(`[generate-quality-3d] Debug: ${name} lod${lod} =`, typeof geometry);
        continue;
      }
      const cleanGeometry = { positions: geometry.positions, indices: geometry.indices, normals: geometry.normals };

      const gltf = createGltf(`${name}_lod${lod}`, cleanGeometry, color);
      const filename = `${name}_lod${lod}.gltf`;
      const filepath = join(modelsRoot, filename);

      await writeFile(filepath, JSON.stringify(gltf, null, 2));
      entries.push({ name: filename, triangles: cleanGeometry.indices.length / 3 });
      generated++;
    }
  }

  console.log(`[generate-quality-3d] Generated ${generated} LOD models`);
  console.log(`[generate-quality-3d] Saved to: ${modelsRoot}`);

  // List what was created
  console.log('\n[generate-quality-3d] Assets:');
  for (const e of entries.slice(0, 10)) {
    console.log(`  ${e.name} (${e.triangles} triangles)`);
  }
}

main().catch(console.error);