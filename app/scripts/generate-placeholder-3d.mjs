#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const modelsRoot = join(__dirname, '..', 'public', 'models', 'aaa');

function align4(n) {
  return Math.ceil(n / 4) * 4;
}

function createTriangleSoup({ triangles, scale }) {
  const positions = [];
  const indices = [];
  for (let i = 0; i < triangles; i += 1) {
    const base = i * 3;
    const x = (i % 6) * 0.15;
    const y = Math.floor(i / 6) * 0.12;
    positions.push(
      x,
      y,
      0,
      x + 0.1 * scale,
      y,
      0,
      x + 0.05 * scale,
      y + 0.09 * scale,
      0
    );
    indices.push(base, base + 1, base + 2);
  }
  return { positions, indices };
}

function createEmbeddedGltf({ name, triangles, scale, color }) {
  const { positions, indices } = createTriangleSoup({ triangles, scale });
  const positionArray = new Float32Array(positions);
  const indexArray = new Uint16Array(indices);

  const indicesBuffer = Buffer.from(indexArray.buffer);
  const positionBuffer = Buffer.from(positionArray.buffer);

  const indicesOffset = 0;
  const positionsOffset = align4(indicesBuffer.length);
  const totalLength = align4(positionsOffset + positionBuffer.length);
  const binary = Buffer.alloc(totalLength, 0);
  indicesBuffer.copy(binary, indicesOffset);
  positionBuffer.copy(binary, positionsOffset);

  const min = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const max = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (let i = 0; i < positions.length; i += 3) {
    for (let axis = 0; axis < 3; axis += 1) {
      min[axis] = Math.min(min[axis], positions[i + axis]);
      max[axis] = Math.max(max[axis], positions[i + axis]);
    }
  }

  return {
    asset: {
      version: '2.0',
      generator: 'chronos-generate-placeholder-3d',
    },
    scene: 0,
    scenes: [{ name, nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [
      {
        name: `${name}_mesh`,
        primitives: [
          {
            attributes: { POSITION: 1 },
            indices: 0,
            material: 0,
            mode: 4,
          },
        ],
      },
    ],
    materials: [
      {
        name: `${name}_mat`,
        pbrMetallicRoughness: {
          baseColorFactor: color,
          metallicFactor: 0.05,
          roughnessFactor: 0.9,
        },
      },
    ],
    accessors: [
      {
        bufferView: 0,
        componentType: 5123,
        count: indexArray.length,
        type: 'SCALAR',
        max: [Math.max(...indices)],
        min: [0],
      },
      {
        bufferView: 1,
        componentType: 5126,
        count: positionArray.length / 3,
        type: 'VEC3',
        min,
        max,
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: indicesOffset,
        byteLength: indicesBuffer.length,
        target: 34963,
      },
      {
        buffer: 0,
        byteOffset: positionsOffset,
        byteLength: positionBuffer.length,
        target: 34962,
      },
    ],
    buffers: [
      {
        byteLength: binary.length,
        uri: `data:application/octet-stream;base64,${binary.toString('base64')}`,
      },
    ],
  };
}

async function main() {
  await mkdir(modelsRoot, { recursive: true });

  const jobs = [
    {
      name: 'char_iron_vanguard_captain_lod0.gltf',
      gltf: createEmbeddedGltf({
        name: 'char_iron_vanguard_captain_lod0',
        triangles: 24,
        scale: 1,
        color: [0.35, 0.38, 0.52, 1],
      }),
    },
    {
      name: 'char_iron_vanguard_captain_lod1.gltf',
      gltf: createEmbeddedGltf({
        name: 'char_iron_vanguard_captain_lod1',
        triangles: 12,
        scale: 0.8,
        color: [0.35, 0.38, 0.52, 1],
      }),
    },
    {
      name: 'char_iron_vanguard_captain_lod2.gltf',
      gltf: createEmbeddedGltf({
        name: 'char_iron_vanguard_captain_lod2',
        triangles: 6,
        scale: 0.6,
        color: [0.35, 0.38, 0.52, 1],
      }),
    },
    {
      name: 'env_marsh_ruins_archway_lod0.gltf',
      gltf: createEmbeddedGltf({
        name: 'env_marsh_ruins_archway_lod0',
        triangles: 18,
        scale: 1,
        color: [0.44, 0.46, 0.40, 1],
      }),
    },
    {
      name: 'env_marsh_ruins_archway_lod1.gltf',
      gltf: createEmbeddedGltf({
        name: 'env_marsh_ruins_archway_lod1',
        triangles: 9,
        scale: 0.8,
        color: [0.44, 0.46, 0.40, 1],
      }),
    },
    {
      name: 'env_marsh_ruins_archway_lod2.gltf',
      gltf: createEmbeddedGltf({
        name: 'env_marsh_ruins_archway_lod2',
        triangles: 6,
        scale: 0.6,
        color: [0.44, 0.46, 0.40, 1],
      }),
    },
    {
      name: 'chronolith_anchor_lod0.gltf',
      gltf: createEmbeddedGltf({
        name: 'chronolith_anchor_lod0',
        triangles: 30,
        scale: 1.1,
        color: [0.40, 0.22, 0.58, 1],
      }),
    },
    {
      name: 'chronolith_anchor_lod1.gltf',
      gltf: createEmbeddedGltf({
        name: 'chronolith_anchor_lod1',
        triangles: 15,
        scale: 0.85,
        color: [0.40, 0.22, 0.58, 1],
      }),
    },
    {
      name: 'chronolith_anchor_lod2.gltf',
      gltf: createEmbeddedGltf({
        name: 'chronolith_anchor_lod2',
        triangles: 9,
        scale: 0.65,
        color: [0.40, 0.22, 0.58, 1],
      }),
    },
  ];

  for (const job of jobs) {
    const file = join(modelsRoot, job.name);
    await writeFile(file, `${JSON.stringify(job.gltf, null, 2)}\n`, 'utf8');
    console.log(`[generate-placeholder-3d] created ${file}`);
  }
}

main().catch((error) => {
  console.error('[generate-placeholder-3d] failed:', error.message);
  process.exit(1);
});
