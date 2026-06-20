#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(__dirname, '..');
const intakePath = join(appRoot, 'production', 'asset-intake.json');
const schemaPath = join(appRoot, 'production', 'asset-contracts.schema.json');

const ALLOWED_TYPES = new Set([
  'character',
  'environment',
  'prop',
  'vfx',
  'audio',
  'ui',
]);
const ALLOWED_TIERS = new Set(['hero', 'mid', 'background']);
const ALLOWED_SOURCES = new Set(['internal', 'outsource', 'marketplace']);
const ALLOWED_STATUS = new Set(['blockout', 'review', 'approved', 'integrated', 'deprecated']);

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function requiredString(asset, key, errors) {
  if (typeof asset[key] !== 'string' || asset[key].trim() === '') {
    errors.push(`${asset.assetId || '<unknown>'}: missing ${key}`);
  }
}

function validateAgainstSchema(asset, schema, errors) {
  const schemaProps = schema.properties || {};
  const required = Array.isArray(schema.required) ? schema.required : [];

  for (const key of required) {
    if (!(key in asset)) {
      errors.push(`${asset.assetId || '<unknown>'}: schema missing required key "${key}"`);
    }
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(asset)) {
      if (!(key in schemaProps)) {
        errors.push(`${asset.assetId || '<unknown>'}: unexpected key "${key}" by schema`);
      }
    }
  }
}

try {
  const schema = readJson(schemaPath);
  const data = readJson(intakePath);
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const errors = [];
  const ids = new Set();

  if (assets.length === 0) {
    errors.push('asset-intake.json contains no assets');
  }

  for (const asset of assets) {
    validateAgainstSchema(asset, schema, errors);
    requiredString(asset, 'assetId', errors);
    requiredString(asset, 'owner', errors);
    requiredString(asset, 'license', errors);
    requiredString(asset, 'legalTicket', errors);

    if (ids.has(asset.assetId)) {
      errors.push(`${asset.assetId}: duplicate assetId`);
    } else {
      ids.add(asset.assetId);
    }

    if (!ALLOWED_TYPES.has(asset.assetType)) {
      errors.push(`${asset.assetId}: invalid assetType=${asset.assetType}`);
    }
    if (!ALLOWED_TIERS.has(asset.tier)) {
      errors.push(`${asset.assetId}: invalid tier=${asset.tier}`);
    }
    if (!ALLOWED_SOURCES.has(asset.source)) {
      errors.push(`${asset.assetId}: invalid source=${asset.source}`);
    }
    if (!ALLOWED_STATUS.has(asset.status)) {
      errors.push(`${asset.assetId}: invalid status=${asset.status}`);
    }

    if (typeof asset.lodCount !== 'number' || asset.lodCount < 0) {
      errors.push(`${asset.assetId}: invalid lodCount`);
    }

    if (typeof asset.hasCollision !== 'boolean') {
      errors.push(`${asset.assetId}: hasCollision must be boolean`);
    }

    if (!Array.isArray(asset.localeCoverage)) {
      errors.push(`${asset.assetId}: localeCoverage must be array`);
    } else {
      for (const locale of asset.localeCoverage) {
        if (typeof locale !== 'string' || !/^[a-z]{2}(-[A-Z]{2})?$/.test(locale)) {
          errors.push(`${asset.assetId}: invalid locale code "${locale}"`);
        }
      }
    }

    if (asset.assetType === 'character') {
      if (typeof asset.skeletonProfile !== 'string' || asset.skeletonProfile.length < 3) {
        errors.push(`${asset.assetId}: character requires skeletonProfile`);
      }
      if (asset.lodCount < 3) {
        errors.push(`${asset.assetId}: character requires lodCount >= 3`);
      }
    }

    if (asset.assetType === 'environment' || asset.assetType === 'prop') {
      if (asset.lodCount < 3) {
        errors.push(`${asset.assetId}: ${asset.assetType} requires lodCount >= 3`);
      }
    }

    if (asset.assetType === 'character' || asset.assetType === 'environment' || asset.assetType === 'prop') {
      if (!asset.graphics || typeof asset.graphics !== 'object') {
        errors.push(`${asset.assetId}: ${asset.assetType} requires graphics metadata`);
      }
    }

    if (asset.assetType === 'ui' || asset.assetType === 'audio') {
      if (asset.localeCoverage.length === 0) {
        errors.push(`${asset.assetId}: ${asset.assetType} requires localeCoverage`);
      }
    }

    if (asset.source === 'marketplace' && !/^LEGAL-/.test(asset.legalTicket || '')) {
      errors.push(`${asset.assetId}: marketplace assets require LEGAL-* ticket`);
    }
  }

  if (errors.length > 0) {
    console.error('[aaa/asset-factory] Gate FAILED');
    for (const error of errors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(`[aaa/asset-factory] Gate PASSED (${assets.length} assets validated)`);
} catch (error) {
  console.error('[aaa/asset-factory] Failed:', error.message);
  process.exit(1);
}
