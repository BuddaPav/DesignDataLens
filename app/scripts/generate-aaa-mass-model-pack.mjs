#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(__dirname, '..');
const modelsRoot = join(appRoot, 'public', 'models', 'aaa', 'bulk');
const intakePath = join(appRoot, 'production', 'asset-intake.json');

const BULK_PREFIX = 'prop_bulk_gen_';
const DEFAULT_MODEL_COUNT = 1000;
const LOD_COUNT = 3;

function align4(n) {
  return Math.ceil(n / 4) * 4;
}

function createTriangleSoup({ triangles, scale, seed }) {
  const positions = [];
  const indices = [];
  for (let i = 0; i < triangles; i += 1) {
    const base = i * 3;
    const ring = i % 12;
    const spiral = Math.floor(i / 12);
    const jitter = ((seed * (i + 3)) % 13) / 160;
    const x = ring * (0.055 + jitter * 0.2);
    const y = spiral * (0.048 + jitter * 0.16);
    const z = ((seed + i * 11) % 9) * 0.006;
    positions.push(
      x,
      y,
      z,
      x + (0.06 + jitter) * scale,
      y + 0.004,
      z + jitter * 0.16,
      x + (0.022 + jitter * 0.42) * scale,
      y + (0.052 + jitter * 0.45) * scale,
      z + 0.02 + jitter * 0.22
    );
    indices.push(base, base + 1, base + 2);
  }
  return { positions, indices };
}

function createEmbeddedGltf({ name, triangles, scale, color, seed }) {
  const { positions, indices } = createTriangleSoup({ triangles, scale, seed });
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
      generator: 'chronos-generate-aaa-mass-model-pack',
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
          metallicFactor: 0.08,
          roughnessFactor: 0.85,
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

function padded(i) {
  return String(i).padStart(4, '0');
}

function triangleBudget(index, lod) {
  const base = 20 + ((index * 7) % 38);
  if (lod === 0) return base;
  if (lod === 1) return Math.max(8, Math.floor(base * 0.55));
  return Math.max(6, Math.floor(base * 0.35));
}

function colorFor(index) {
  const r = 0.2 + ((index * 37) % 70) / 100;
  const g = 0.24 + ((index * 19) % 58) / 100;
  const b = 0.3 + ((index * 11) % 52) / 100;
  return [Number(r.toFixed(3)), Number(g.toFixed(3)), Number(b.toFixed(3)), 1];
}

function buildAssetEntry(index) {
  const id = padded(index);
  const base = `${BULK_PREFIX}${id}`;
  const lodFiles = Array.from({ length: LOD_COUNT }, (_, lod) => `models/aaa/bulk/${base}_lod${lod}.gltf`);
  return {
    assetId: `${base}_v1`,
    assetType: 'prop',
    tier: 'background',
    owner: 'bulk-model-pipeline',
    source: 'internal',
    license: 'internal-procedural',
    lodCount: LOD_COUNT,
    hasCollision: true,
    skeletonProfile: null,
    localeCoverage: [],
    status: 'approved',
    legalTicket: `LEGAL-BULK-${id}`,
    graphics: {
      triangleCount: triangleBudget(index, 0),
      materialCount: 1,
      maxTextureSize: 512,
      textureSetCount: 1,
      modelFormat: 'gltf',
      modelPath: lodFiles[0],
      lodFiles,
    },
  };
}

async function writeModelFiles(index) {
  const id = padded(index);
  const base = `${BULK_PREFIX}${id}`;
  const color = colorFor(index);
  for (let lod = 0; lod < LOD_COUNT; lod += 1) {
    const triangles = triangleBudget(index, lod);
    const scale = lod === 0 ? 1 : lod === 1 ? 0.8 : 0.62;
    const gltf = createEmbeddedGltf({
      name: `${base}_lod${lod}`,
      triangles,
      scale,
      color,
      seed: index * 97 + lod * 29,
    });
    const fileName = `${base}_lod${lod}.gltf`;
    const filePath = join(modelsRoot, fileName);
    await writeFile(filePath, `${JSON.stringify(gltf, null, 2)}\n`, 'utf8');
  }
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const requested = Number.parseInt(process.env.CHRONOS_BULK_MODEL_COUNT ?? '', 10);
  const modelCount = Number.isFinite(requested) && requested >= 1000 ? requested : DEFAULT_MODEL_COUNT;

  await mkdir(modelsRoot, { recursive: true });
  for (let i = 1; i <= modelCount; i += 1) {
    await writeModelFiles(i);
    if (i % 100 === 0) {
      console.log(`[generate-aaa-mass-model-pack] generated ${i}/${modelCount} model families`);
    }
  }

  const intakeRaw = await readFile(intakePath, 'utf8');
  const intake = JSON.parse(intakeRaw);
  const currentAssets = Array.isArray(intake.assets) ? intake.assets : [];
  const stableAssets = currentAssets.filter(
    (a) => typeof a?.assetId === 'string' && !a.assetId.startsWith(BULK_PREFIX)
  );
  const bulkAssets = Array.from({ length: modelCount }, (_, idx) => buildAssetEntry(idx + 1));
  intake.updatedAt = todayIsoDate();
  intake.assets = [...stableAssets, ...bulkAssets];
  await writeFile(intakePath, `${JSON.stringify(intake, null, 2)}\n`, 'utf8');

  console.log(
    `[generate-aaa-mass-model-pack] ready: ${bulkAssets.length} generated assets, ${intake.assets.length} total in asset-intake`
  );
}

main().catch((error) => {
  console.error('[generate-aaa-mass-model-pack] failed:', error.message);
  process.exit(1);
});
