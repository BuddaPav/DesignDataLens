// Security Scanner - SAST/DAST integration
// Scans for secrets, vulnerabilities, and code quality issues

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import * as secondBrain from '../orchestrator';

const APP_DIR = './app';
const PATTERNS = {
  secrets: [
    /api[_-]?key["']?\s*[:=]\s*["'][^"']{8,}/gi,
    /secret["']?\s*[:=]\s*["'][^"']{8,}/gi,
    /password["']?\s*[:=]\s*["'][^"']{8,}/gi,
    /token["']?\s*[:=]\s*["'][^"']{8,}/gi,
    /bearer\s+[a-zA-Z0-9_-]{20,}/gi,
    /ghp_[a-zA-Z0-9]{36}/gi,
    /sk-[a-zA-Z0-9]{48}/gi
  ],
  vulnerabilities: [
    /eval\s*\(/g,
    /innerHTML\s*=/g,
    /dangerouslySetInnerHTML/g,
    /dangerouslySetInnerHTML/g
  ]
};

interface ScanResult {
  file: string;
  line: number;
  type: string;
  content: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export async function scanFiles(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const srcDir = path.join(APP_DIR, 'src');
  
  if (!fs.existsSync(srcDir)) return results;
  
  await scanDir(srcDir, results);
  
  // Report findings
  for (const result of results) {
    secondBrain.recordVulnerability(result.severity, `${result.type}: ${result.content}`, result.file);
  }
  
  console.log(`[security] Scanned ${results.length} issues`);
  return results;
}

async function scanDir(dir: string, results: ScanResult[]): Promise<void> {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        await scanDir(fullPath, results);
      } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
        await scanFile(fullPath, results);
      }
    }
  } catch {}
}

async function scanFile(filePath: string, results: ScanResult[]): Promise<void> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Check for secrets
    for (const pattern of PATTERNS.secrets) {
      const matches = content.match(pattern);
      if (matches) {
        for (const match of matches) {
          const lineNum = findLineNumber(lines, match);
          results.push({
            file: filePath,
            line: lineNum,
            type: 'secret',
            content: match.substring(0, 50),
            severity: 'critical'
          });
          secondBrain.recordSecretScan(filePath, 'secret', false, lineNum);
        }
      }
    }
    
    // Check for vulnerabilities
    for (const pattern of PATTERNS.vulnerabilities) {
      if (pattern.test(content)) {
        const lineNum = findLineNumber(lines, pattern.source);
        results.push({
          file: filePath,
          line: lineNum,
          type: 'vulnerability',
          content: pattern.source,
          severity: 'high'
        });
      }
    }
  } catch {}
}

function findLineNumber(lines: string[], search: string): number {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(search)) return i + 1;
  }
  return 0;
}

// Export for standalone use
if (require.main === module) {
  scanFiles().then(results => {
    console.log('Found', results.length, 'issues');
    process.exit(results.length > 0 ? 1 : 0);
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
