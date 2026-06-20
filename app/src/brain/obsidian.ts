/**
 * Obsidian Integration
 *
 * Bridge between Brain system and Obsidian "Второй Мозг" vault.
 * Provides unified cognitive system linking code agents with documentation layers.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Paths
 */
const OBSIDIAN_BASE = 'c:/Users/Den/Documents/История Шарма/История про Шарма/Второй Мозг';
const TEMPLATES_DIR = path.join(OBSIDIAN_BASE, 'TEMPLATES');

/**
 * Layer mapping: vector -> layer file
 */
export const VECTOR_LAYER_MAP: Record<number, string> = {
  // Cognitive (14-20)
  14: '00-Когнитивный слой',
  15: '00-Когнитивный слой',
  16: '00-Когнитивный слой',
  17: '00-Когнитивный слой',
  18: '00-Когнитивный слой',
  19: '00-Когнитивный слой',
  20: '00-Когнитивный слой',

  // Communication (21-28)
  21: '14-Коммуникационный слой',
  22: '14-Коммуникационный слой',
  23: '14-Коммуникационный слой',
  24: '14-Коммуникационный слой',
  25: '14-Коммуникационный слой',
  26: '14-Коммуникационный слой',
  27: '14-Коммуникационный слой',
  28: '14-Коммуникационный слой',

  // Processes (29-35)
  29: '15-Процессный расширенный слой',
  30: '20-Технический глубинный слой',
  31: '15-Процессный расширенный слой',
  32: '15-Процессный расширенный слой',
  33: '15-Процессный расширенный слой',
  34: '04-Процессный слой',
  35: '20-Технический глубинный слой',

  // Infrastructure (36-42)
  36: '16-Инфраструктурный расширенный слой',
  37: '16-Инфраструктурный расширенный слой',
  38: '16-Инфраструктурный расширенный слой',
  39: '08-Data слой',
  40: '08-Data слой',
  41: '01-Инфраструктурный слой',
  42: '16-Инфраструктурный расширенный слой',

  // Economy (43-56)
  43: '17-Экономический слой',
  44: '17-Экономический слой',
  45: '17-Экономический слой',
  46: '17-Экономический слой',
  47: '17-Экономический слой',
  48: '17-Экономический слой',
  49: '17-Экономический слой',
  50: '17-Экономический слой',
  51: '00-Когнитивный слой',
  52: '00-Когнитивный слой',
  53: '17-Экономический слой',
  54: '16-Инфраструктурный расширенный слой',
  55: '17-Экономический слой',
  56: '20-Технический глубинный слой',

  // Ethics (57-62)
  57: '18-Этический слой',
  58: '18-Этический слой',
  59: '18-Этический слой',
  60: '18-Этический слой',
  61: '18-Этический слой',

  // Organization (63-68)
  63: '19-Организационный слой',
  64: '19-Организационный слой',
  65: '19-Организационный слой',
  66: '19-Организационный слой',
  67: '19-Организационный слой',
  68: '19-Организационный слой',

  // Technical (69-78)
  69: '20-Технический глубинный слой',
  70: '20-Технический глубинный слой',
  71: '00-Когнитивный слой',
  72: '21-Качество генерации слой',
  73: '20-Технический глубинный слой',
  74: '20-Технический глубинный слой',
  75: '20-Технический глубинный слой',
  76: '20-Технический глубинный слой',
  77: '20-Технический глубинный слой',
  78: '21-Качество генерации слой',

  // Knowledge (79-85)
  79: '08-Data слой',
  80: '08-Data слой',
  81: '08-Data слой',
  82: '08-Data слой',
  83: '08-Data слой',
  84: '08-Data слой',
  85: '00-Когнитивный слой',

  // Generation Quality (86-93)
  86: '21-Качество генерации слой',
  87: '21-Качество генерации слой',
  88: '17-Экономический слой',
  89: '21-Качество генерации слой',
  90: '21-Качество генерации слой',
  91: '21-Качество генерации слой',
  92: '21-Качество генерации слой',
  93: '17-Экономический слой',

  // Environment (94-100)
  94: '22-Средовой слой',
  95: '22-Средовой слой',
  96: '22-Средовой слой',
  97: '22-Средовой слой',
  98: '22-Средовой слой',
  99: '22-Средовой слой',
  100: '22-Средовой слой',

  // Risk (101-106)
  101: '23-Risk слой',
  102: '23-Risk слой',
  103: '23-Risk слой',
  104: '23-Risk слой',
  105: '23-Risk слой',
  106: '00-Когнитивный слой',

  // Aesthetic/Vibe (107-112)
  107: '24-Vibe слой',
  108: '24-Vibe слой',
  109: '24-Vibe слой',
  110: '24-Vibe слой',
  111: '24-Vibe слой',
  112: '24-Vibe слой',

  // Evolution (113-120)
  113: '13-Метакогнитивный слой',
  114: '13-Метакогнитивный слой',
  115: '13-Метакогнитивный слой',
  116: '13-Метакогнитивный слой',
  117: '00-Когнитивный слой',
  118: '13-Метакогнитивный слой',
  119: '17-Экономический слой',
  120: '17-Экономический слой',
};

/**
 * Agent to vector mapping
 */
export const AGENT_VECTOR_MAP: Record<string, number[]> = {
  ContextAgent: [14, 17, 18, 39, 41, 71, 85],
  GeneratorAgent: [86, 87, 88, 90, 91, 107, 108, 109, 110, 111, 112],
  VerifierAgent: [57, 58, 59, 60, 61, 69, 70, 73, 74, 75, 76, 77, 86, 89, 92],
  MemoryAgent: [18, 21, 25, 32, 34, 38, 39, 40, 41, 42, 79, 80, 81, 82, 83, 84],
  MetricsAgent: [43, 44, 45, 46, 47, 48, 49, 53, 55, 88, 93, 101, 119, 120],
};

/**
 * Layer info from Obsidian
 */
export interface LayerInfo {
  name: string;
  path: string;
  vectors: number[];
  exists: boolean;
}

/**
 * Template info
 */
export interface TemplateInfo {
  name: string;
  path: string;
  category: string;
}

/**
 * Search result from Obsidian vault
 */
export interface SearchResult {
  path: string;
  title: string;
  snippet: string;
}

/**
 * Get layer file by vector number
 */
export function getLayerByVector(vector: number): LayerInfo {
  const layerName = VECTOR_LAYER_MAP[vector] || '00-Когнитивный слой';
  const layerPath = path.join(OBSIDIAN_BASE, `${layerName}.md`);

  return {
    name: layerName,
    path: layerPath,
    vectors: getVectorsInLayer(layerName),
    exists: fs.existsSync(layerPath),
  };
}

/**
 * Get multiple layers by vectors
 */
export function getLayersByVectors(vectors: number[]): LayerInfo[] {
  const layerMap = new Map<string, LayerInfo>();

  for (const v of vectors) {
    const layer = getLayerByVector(v);
    if (!layerMap.has(layer.name)) {
      layerMap.set(layer.name, layer);
    }
  }

  return Array.from(layerMap.values());
}

/**
 * Get all vectors in a layer
 */
function getVectorsInLayer(layerName: string): number[] {
  const mapping: Record<string, number[]> = {
    '00-Когнитивный слой': [14, 15, 16, 17, 18, 19, 20, 51, 52, 71, 85, 106, 113, 114, 115, 116, 117, 118],
    '01-Инфраструктурный слой': [41],
    '14-Коммуникационный слой': [21, 22, 23, 24, 25, 26, 27, 28],
    '15-Процессный расширенный слой': [29, 31, 32, 33],
    '16-Инфраструктурный расширенный слой': [36, 37, 38, 42, 54],
    '17-Экономический слой': [43, 44, 45, 46, 47, 48, 49, 50, 53, 88, 93, 119, 120],
    '18-Этический слой': [57, 58, 59, 60, 61],
    '19-Организационный слой': [63, 64, 65, 66, 67, 68],
    '20-Технический глубинный слой': [30, 35, 56, 69, 70, 73, 74, 75, 76, 77],
    '21-Качество генерации слой': [72, 78, 86, 87, 89, 90, 91, 92],
    '22-Средовой слой': [94, 95, 96, 97, 98, 99, 100],
    '23-Risk слой': [101, 102, 103, 104, 105],
    '24-Vibe слой': [107, 108, 109, 110, 111, 112],
    '13-Метакогнитивный слой': [113, 114, 115, 116, 118],
    '04-Процессный слой': [34],
    '08-Data слой': [39, 40, 79, 80, 81, 82, 83, 84],
  };

  return mapping[layerName] || [];
}

/**
 * Get all available templates
 */
export function getTemplates(): TemplateInfo[] {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    return [];
  }

  const files = fs.readdirSync(TEMPLATES_DIR);
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f.replace('.md', ''),
      path: path.join(TEMPLATES_DIR, f),
      category: extractCategory(f),
    }));
}

/**
 * Get specific template by name
 */
export function getTemplate(templateName: string): string | null {
  const templatePath = path.join(TEMPLATES_DIR, `${templateName}.md`);

  if (!fs.existsSync(templatePath)) {
    return null;
  }

  return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Extract category from template name
 */
function extractCategory(templateName: string): string {
  if (templateName.startsWith('00-')) return 'Workflow';
  if (templateName.startsWith('01-')) return 'Search';
  if (templateName.startsWith('02-')) return 'Prompt';
  if (templateName.startsWith('03-')) return 'Test';
  if (templateName.startsWith('04-')) return 'Validation';
  if (templateName.startsWith('06-')) return 'Security';
  if (templateName.startsWith('07-')) return 'SRE';
  if (templateName.startsWith('08-')) return 'Schema';
  if (templateName.startsWith('09-')) return 'Release';
  if (templateName.startsWith('10-')) return 'Network';
  if (templateName.startsWith('11-')) return 'RFC';
  if (templateName.startsWith('12-')) return 'Bayes';
  if (templateName.startsWith('AFK-')) return 'Game';
  return 'General';
}

/**
 * Search vault content
 */
export function searchVault(query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const queryLower = query.toLowerCase();

  if (!fs.existsSync(OBSIDIAN_BASE)) {
    return results;
  }

  const searchDir = (dir: string) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && file !== '.git') {
        searchDir(filePath);
      } else if (file.endsWith('.md')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.toLowerCase().includes(queryLower)) {
          results.push({
            path: filePath,
            title: extractTitle(content),
            snippet: extractSnippet(content, queryLower),
          });
        }
      }
    }
  };

  searchDir(OBSIDIAN_BASE);

  return results.slice(0, 10); // Limit results
}

/**
 * Extract title from markdown
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

/**
 * Extract snippet around match
 */
function extractSnippet(content: string, query: string): string {
  const idx = content.toLowerCase().indexOf(query);
  if (idx < 0) return content.slice(0, 100);

  const start = Math.max(0, idx - 50);
  const end = Math.min(content.length, idx + query.length + 50);

  return content.slice(start, end).trim() + '...';
}

/**
 * Get vault statistics
 */
export function getVaultStats(): {
  layers: number;
  templates: number;
  vectors: number;
} {
  const layers = fs.existsSync(OBSIDIAN_BASE)
    ? fs.readdirSync(OBSIDIAN_BASE).filter(f => f.endsWith('.md')).length
    : 0;

  const templates = getTemplates().length;
  const vectors = Object.keys(VECTOR_LAYER_MAP).length;

  return { layers, templates, vectors };
}

/**
 * Get Obsidian vault path
 */
export function getVaultPath(): string {
  return OBSIDIAN_BASE;
}

export default {
  getLayerByVector,
  getLayersByVectors,
  getTemplates,
  getTemplate,
  searchVault,
  getVaultStats,
  getVaultPath,
  VECTOR_LAYER_MAP,
  AGENT_VECTOR_MAP,
};