#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(__dirname, '..');
const intakePath = join(appRoot, 'production', 'asset-intake.json');
const standardsPath = join(appRoot, 'production', 'graphics-standards.json');
const publicRoot = join(appRoot, 'public');

const THREE_D_TYPES = new Set(['character', 'environment', 'prop']);
const TIER_VALUES = new Set(['hero', 'mid', 'background']);
const RELEASE_READY_STATUS = new Set(['approved', 'integrated']);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function fileExtension(path) {
  const idx = path.lastIndexOf('.');
  if (idx === -1) return '';
  return path.slice(idx + 1).toLowerCase();
}

function analyzeGltfMetrics(absPath) {
  const gltf = readJson(absPath);
  const accessors = Array.isArray(gltf.accessors) ? gltf.accessors : [];
  let triangles = 0;

  const meshes = Array.isArray(gltf.meshes) ? gltf.meshes : [];
  for (const mesh of meshes) {
    const primitives = Array.isArray(mesh.primitives) ? mesh.primitives : [];
    for (const primitive of primitives) {
      if (typeof primitive.indices === 'number') {
        const accessor = accessors[primitive.indices];
        const count = asNumber(accessor?.count);
        if (Number.isFinite(count)) triangles += Math.floor(count / 3);
        continue;
      }
      const positionAccessorIndex = primitive?.attributes?.POSITION;
      if (typeof positionAccessorIndex === 'number') {
        const accessor = accessors[positionAccessorIndex];
        const count = asNumber(accessor?.count);
        if (Number.isFinite(count)) triangles += Math.floor(count / 3);
      }
    }
  }

  const materials = Array.isArray(gltf.materials) ? gltf.materials.length : 0;
  return { triangles, materials };
}

try {
  const intake = readJson(intakePath);
  const standards = readJson(standardsPath);
  const assets = Array.isArray(intake.assets) ? intake.assets : [];
  const errors = [];

  if (assets.length === 0) {
    throw new Error('asset-intake.json contains no assets');
  }

  if (!Number.isFinite(asNumber(standards.minLodCount))) {
    throw new Error('graphics-standards.json missing numeric minLodCount');
  }

  const checked = [];
  for (const asset of assets) {
    if (!THREE_D_TYPES.has(asset.assetType)) continue;
    if (!TIER_VALUES.has(asset.tier)) {
      errors.push(`${asset.assetId}: invalid tier "${asset.tier}"`);
      continue;
    }
    const graphics = asset.graphics;
    if (!graphics || typeof graphics !== 'object') {
      errors.push(`${asset.assetId}: missing graphics metadata`);
      continue;
    }

    const triangleCount = asNumber(graphics.triangleCount);
    const materialCount = asNumber(graphics.materialCount);
    const maxTextureSize = asNumber(graphics.maxTextureSize);
    const textureSetCount = asNumber(graphics.textureSetCount);
    const lodCount = asNumber(asset.lodCount);
    const modelFormat = graphics.modelFormat;
    const modelPath = graphics.modelPath;
    const lodFiles = Array.isArray(graphics.lodFiles) ? graphics.lodFiles : [];

    if (!Number.isFinite(triangleCount) || triangleCount <= 0) {
      errors.push(`${asset.assetId}: invalid graphics.triangleCount`);
    }
    if (!Number.isFinite(materialCount) || materialCount <= 0) {
      errors.push(`${asset.assetId}: invalid graphics.materialCount`);
    }
    if (!Number.isFinite(maxTextureSize) || maxTextureSize <= 0) {
      errors.push(`${asset.assetId}: invalid graphics.maxTextureSize`);
    }
    if (!Number.isFinite(textureSetCount) || textureSetCount <= 0) {
      errors.push(`${asset.assetId}: invalid graphics.textureSetCount`);
    }
    if (!Number.isFinite(lodCount)) {
      errors.push(`${asset.assetId}: invalid lodCount`);
    }
    if (modelFormat !== 'glb' && modelFormat !== 'gltf') {
      errors.push(`${asset.assetId}: 3D assets require modelFormat glb/gltf`);
    }
    if (modelPath !== null && typeof modelPath !== 'string') {
      errors.push(`${asset.assetId}: graphics.modelPath must be string or null`);
    }
    if (!Array.isArray(graphics.lodFiles)) {
      errors.push(`${asset.assetId}: graphics.lodFiles must be array`);
    }

    if (lodCount < standards.minLodCount) {
      errors.push(`${asset.assetId}: lodCount ${lodCount} < min ${standards.minLodCount}`);
    }

    const tierTriangleBudget = asNumber(standards.triangleBudgetByTier?.[asset.tier]);
    const tierMaterialBudget = asNumber(standards.materialBudgetByTier?.[asset.tier]);
    const tierTextureBudget = asNumber(standards.maxTextureByTier?.[asset.tier]);

    if (!Number.isFinite(tierTriangleBudget) || !Number.isFinite(tierMaterialBudget) || !Number.isFinite(tierTextureBudget)) {
      errors.push(`${asset.assetId}: missing tier budgets in graphics-standards`);
      continue;
    }

    if (triangleCount > tierTriangleBudget) {
      errors.push(`${asset.assetId}: triangles ${triangleCount} exceed budget ${tierTriangleBudget}`);
    }
    if (materialCount > tierMaterialBudget) {
      errors.push(`${asset.assetId}: materials ${materialCount} exceed budget ${tierMaterialBudget}`);
    }
    if (maxTextureSize > tierTextureBudget) {
      errors.push(`${asset.assetId}: maxTextureSize ${maxTextureSize} exceeds budget ${tierTextureBudget}`);
    }

    const allowedTextureSizes = Array.isArray(standards.allowedTextureSizes)
      ? standards.allowedTextureSizes.map(asNumber)
      : [];
    if (!allowedTextureSizes.includes(maxTextureSize)) {
      errors.push(`${asset.assetId}: maxTextureSize ${maxTextureSize} is not in allowedTextureSizes`);
    }

    if (RELEASE_READY_STATUS.has(asset.status)) {
      if (typeof modelPath !== 'string' || modelPath.trim() === '') {
        errors.push(`${asset.assetId}: status=${asset.status} requires graphics.modelPath`);
      } else {
        const absModelPath = join(publicRoot, modelPath);
        if (!existsSync(absModelPath)) {
          errors.push(`${asset.assetId}: modelPath not found at public/${modelPath}`);
        } else {
          const ext = fileExtension(modelPath);
          if (ext !== modelFormat) {
            errors.push(`${asset.assetId}: modelFormat=${modelFormat} but file extension is .${ext}`);
          }
          if (ext === 'gltf') {
            const measured = analyzeGltfMetrics(absModelPath);
            if (measured.triangles !== triangleCount) {
              errors.push(
                `${asset.assetId}: triangleCount mismatch declared=${triangleCount} measured=${measured.triangles}`
              );
            }
            if (measured.materials !== materialCount) {
              errors.push(
                `${asset.assetId}: materialCount mismatch declared=${materialCount} measured=${measured.materials}`
              );
            }
          }
        }
      }

      if (lodFiles.length < standards.minLodCount) {
        errors.push(
          `${asset.assetId}: status=${asset.status} requires lodFiles >= ${standards.minLodCount}`
        );
      } else {
        for (const lodFile of lodFiles) {
          const absLodPath = join(publicRoot, lodFile);
          if (!existsSync(absLodPath)) {
            errors.push(`${asset.assetId}: lod file not found at public/${lodFile}`);
          }
        }
      }
    }

    checked.push(asset.assetId);
  }

  if (checked.length === 0) {
    errors.push('No 3D assets found for graphics gate');
  }

  if (errors.length > 0) {
    console.error('[aaa/graphics] Gate FAILED');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(`[aaa/graphics] Gate PASSED (${checked.length} 3D assets validated)`);
} catch (error) {
  console.error('[aaa/graphics] Failed:', error.message);
  process.exit(1);
}
