// Onboarding Snapshot Generator
// Creates project context for new developers in 1 prompt

import fs from 'fs';
import path from 'path';
import * as secondBrain from '../orchestrator';

const APP_DIR = './app';

export async function generateSnapshot(): Promise<string> {
  const summary = await getProjectSummary();
  const architecture = await getArchitecture();
  const keyFiles = getKeyFiles();
  const conventions = getConventions();
  
  // Save to second brain
  secondBrain.createSnapshot(summary, architecture, keyFiles, conventions);
  
  return formatSnapshot(summary, architecture, keyFiles, conventions);
}

async function getProjectSummary(): Promise<string> {
  const pkgPath = path.join(APP_DIR, 'package.json');
  if (!fs.existsSync(pkgPath)) return 'Project';
  
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return `${pkg.name} - ${pkg.description || 'Game'}`;
  } catch {
    return 'Project';
  }
}

async function getArchitecture(): Promise<string> {
  const dirs = ['src/components', 'src/engine', 'src/world', 'src/entities'];
  const structure: string[] = [];
  
  for (const dir of dirs) {
    const fullPath = path.join(APP_DIR, dir);
    if (fs.existsSync(fullPath)) {
      const subdirs = fs.readdirSync(fullPath).filter(f => 
        fs.statSync(path.join(fullPath, f)).isDirectory()
      );
      structure.push(`${dir}: ${subdirs.join(', ')}`);
    }
  }
  
  return structure.join('\n') || 'Simple structure';
}

function getKeyFiles(): string[] {
  return [
    'src/lib/featureFlags.ts',
    'src/lib/utils.ts',
    'src/version.ts',
    'src/App.tsx',
    'electron/main.cjs'
  ];
}

function getConventions(): string[] {
  return [
    'Components: PascalCase (WorldScene3D.tsx)',
    'Hooks: camelCase with use prefix (useGameState.ts)',
    'Types: PascalCase with Interface suffix',
    'Constants: SCREAMING_SNAKE_CASE',
    'No any types - use proper typing',
    'Feature flags for all new features'
  ];
}

function formatSnapshot(summary: string, architecture: string, keyFiles: string[], conventions: string[]): string {
  return `# ${summary}

## Architecture
${architecture}

## Key Files
${keyFiles.map(f => `- ${f}`).join('\n')}

## Conventions
${conventions.map(c => `- ${c}`).join('\n')}

## Quick Start
1. npm install
2. npm run dev
3. Open http://localhost:5173
`;
}

// Export
if (require.main === module) {
  generateSnapshot().then(snap => {
    console.log(snap);
  }).catch(console.error);
}
