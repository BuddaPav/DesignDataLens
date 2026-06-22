// FileValidator: Detects file corruption, duplicates, and triggers recovery
// Core of the fixed validation gate

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ValidationError {
  file: string;
  type: 'duplicate' | 'malformed' | 'missing_export' | 'circular' | 'type_mismatch';
  details: string;
  lines?: number[];
  severity: 'critical' | 'high' | 'medium';
}

interface FileCheckResult {
  valid: boolean;
  errors: ValidationError[];
  recoveryAttempted: boolean;
  recoverySuccess: boolean;
}

class FileValidator {
  private recoveryCache: Map<string, { lastAttempt: number; success: boolean }> = new Map();
  private DUPLICATE_PATTERN = /export\s+(function|class|type|const|interface)\s+(\w+)/g;
  private RECOVERY_COOLDOWN = 60000; // 1 min between recovery attempts

  /**
   * Check generated code BEFORE writing to file
   * Prevents agents from writing corrupted code
   */
  checkContent(filePath: string, content: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const lines = content.split('\n');

    // Check for duplicate imports (indicator of code gen issue)
    const importLines = lines.filter(l => l.match(/^import\s+.*from/));
    const importCounts = new Map<string, number>();
    for (const line of importLines) {
      const match = line.match(/from\s+['"]([^'"]+)['"]/);
      if (match) {
        const module = match[1];
        importCounts.set(module, (importCounts.get(module) || 0) + 1);
      }
    }

    for (const [module, count] of importCounts.entries()) {
      if (count > 1) {
        errors.push(`Duplicate import from "${module}" (${count} times) - likely code generation error`);
      }
    }

    // Check for duplicate function/class exports
    const exports = new Map<string, number>();
    for (const line of lines) {
      const match = line.match(/export\s+(function|class|const|type|interface)\s+(\w+)/);
      if (match) {
        const name = match[2];
        exports.set(name, (exports.get(name) || 0) + 1);
      }
    }

    for (const [name, count] of exports.entries()) {
      if (count > 1) {
        errors.push(`Duplicate export "${name}" (${count} times) - code generation corruption`);
      }
    }

    // Check for code duplication patterns (3+ identical lines in sequence)
    for (let i = 0; i < lines.length - 2; i++) {
      const segment = lines.slice(i, i + 3).join('\n');
      const laterIndex = lines.slice(i + 3).findIndex(l => lines[i] === l);
      if (laterIndex >= 0) {
        const duplicateCount = lines.filter(l => l === lines[i]).length;
        if (duplicateCount >= 3 && lines[i].trim() && !lines[i].trim().startsWith('//')) {
          errors.push(`Code duplication detected at line ${i + 1}: "${lines[i].substring(0, 40)}..." repeated ${duplicateCount} times`);
          break; // Report only first occurrence
        }
      }
    }

    // Check for incomplete TypeScript blocks
    const braceCount = (content.match(/{/g) || []).length;
    const closeCount = (content.match(/}/g) || []).length;
    if (braceCount !== closeCount) {
      errors.push(`Mismatched braces: ${braceCount} { vs ${closeCount} } - incomplete code`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Check a TypeScript file for common corruption patterns
   */
  checkFile(filePath: string): FileCheckResult {
    const result: FileCheckResult = {
      valid: true,
      errors: [],
      recoveryAttempted: false,
      recoverySuccess: false,
    };

    if (!fs.existsSync(filePath)) {
      result.errors.push({
        file: filePath,
        type: 'missing_export',
        details: `File not found: ${filePath}`,
        severity: 'critical',
      });
      result.valid = false;
      return result;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Check 1: Detect duplicate exports
    const exports: Map<string, number[]> = new Map();
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const matches = Array.from(line.matchAll(this.DUPLICATE_PATTERN));
      for (const match of matches) {
        const name = match[2];
        if (!exports.has(name)) {
          exports.set(name, []);
        }
        exports.get(name)!.push(i + 1);
      }
    }

    for (const [name, lineNumbers] of exports) {
      if (lineNumbers.length > 1) {
        result.errors.push({
          file: filePath,
          type: 'duplicate',
          details: `Duplicate export: '${name}' found at lines ${lineNumbers.join(', ')}`,
          lines: lineNumbers,
          severity: 'critical',
        });
        result.valid = false;
      }
    }

    // Check 2: Detect duplicate import blocks (5+ consecutive identical imports)
    const importLines = lines.filter(l => l.trim().startsWith('import'));
    const importCounts: Map<string, number> = new Map();
    for (const importLine of importLines) {
      importCounts.set(importLine, (importCounts.get(importLine) || 0) + 1);
    }
    for (const [importLine, count] of importCounts) {
      if (count > 2) {
        result.errors.push({
          file: filePath,
          type: 'duplicate',
          details: `Duplicate import block repeated ${count} times: ${importLine.substring(0, 60)}...`,
          severity: 'high',
        });
        result.valid = false;
      }
    }

    // Check 3: Detect task comments without ticket (AFK Game rule)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('TODO:') && !line.includes('[') && !line.includes(']')) {
        result.errors.push({
          file: filePath,
          type: 'malformed',
          details: `TODO at line ${i + 1} has no ticket reference: ${line.substring(0, 60)}...`,
          lines: [i + 1],
          severity: 'medium',
        });
      }
    }

    // Check 4: Validate file doesn't exceed line count anomalies
    // If file has >3 distinct sections with identical code blocks, it's corrupted
    const sections = this.detectCodeDuplication(lines);
    if (sections > 2) {
      result.errors.push({
        file: filePath,
        type: 'duplicate',
        details: `File has ${sections} duplicate code sections (expected ≤ 2)`,
        severity: 'critical',
      });
      result.valid = false;
    }

    // If errors found and recovery is needed, attempt it
    if (!result.valid && this.shouldAttemptRecovery(filePath)) {
      result.recoveryAttempted = true;
      result.recoverySuccess = this.attemptGitRestore(filePath);
    }

    return result;
  }

  /**
   * Detect duplicate code blocks by looking for repeated function definitions
   */
  private detectCodeDuplication(lines: string[]): number {
    const functionSignatures: Map<string, number> = new Map();
    let duplicateSectionCount = 0;

    let currentFunction = '';
    for (const line of lines) {
      if (line.match(/^export\s+(function|class)/)) {
        const match = line.match(/^\s*(export\s+)?(function|class)\s+(\w+)/);
        if (match) {
          currentFunction = match[3];
          functionSignatures.set(currentFunction, (functionSignatures.get(currentFunction) || 0) + 1);
        }
      }
    }

    for (const count of functionSignatures.values()) {
      if (count > 1) {
        duplicateSectionCount += count - 1;
      }
    }

    return duplicateSectionCount;
  }

  /**
   * Check if recovery should be attempted (cooldown check)
   */
  private shouldAttemptRecovery(filePath: string): boolean {
    const cached = this.recoveryCache.get(filePath);
    if (!cached) return true;

    const now = Date.now();
    if (now - cached.lastAttempt < this.RECOVERY_COOLDOWN) {
      return false; // Cooldown active
    }

    return true;
  }

  /**
   * Attempt to restore file from git HEAD
   */
  private attemptGitRestore(filePath: string): boolean {
    try {
      const projectRoot = 'c:/Users/Den/Downloads/AFK Game';
      const relPath = path.relative(projectRoot, filePath);

      console.log(`[FileValidator] Attempting git restore: ${relPath}`);

      // Check if file is tracked in git
      try {
        execSync(`git ls-files --error-unmatch "${relPath}"`, {
          cwd: projectRoot,
          stdio: 'pipe',
        });
      } catch {
        console.warn(`[FileValidator] File not tracked in git: ${relPath}`);
        this.recoveryCache.set(filePath, { lastAttempt: Date.now(), success: false });
        return false;
      }

      // Restore from git
      execSync(`git restore "${relPath}"`, {
        cwd: projectRoot,
        stdio: 'pipe',
      });

      console.log(`[FileValidator] Successfully restored: ${relPath}`);
      this.recoveryCache.set(filePath, { lastAttempt: Date.now(), success: true });
      return true;
    } catch (err: any) {
      console.error(`[FileValidator] Restore failed:`, err.message);
      this.recoveryCache.set(filePath, { lastAttempt: Date.now(), success: false });
      return false;
    }
  }

  /**
   * Batch validate all files in a directory
   */
  validateDirectory(dirPath: string, extensions: string[] = ['.ts', '.tsx']): FileCheckResult[] {
    const results: FileCheckResult[] = [];

    const scanDir = (dir: string) => {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory() && !file.startsWith('.') && !file.startsWith('node_modules')) {
            scanDir(fullPath);
          } else if (extensions.some(ext => file.endsWith(ext))) {
            results.push(this.checkFile(fullPath));
          }
        }
      } catch {}
    };

    scanDir(dirPath);
    return results;
  }

  /**
   * Generate validation report
   */
  generateReport(results: FileCheckResult[]): string {
    const critical = results.filter(r => r.errors.some(e => e.severity === 'critical'));
    const recovered = results.filter(r => r.recoverySuccess);
    const failed = results.filter(r => r.recoveryAttempted && !r.recoverySuccess);

    const report = `
=== FileValidator Report ===
Total files checked: ${results.length}
Valid files: ${results.filter(r => r.valid).length}
Invalid files: ${results.filter(r => !r.valid).length}
  - Critical errors: ${critical.length}
  - Recovered files: ${recovered.length}
  - Recovery failures: ${failed.length}

${
  critical.length > 0
    ? `Critical Issues (${critical.length}):\n${critical
        .map(r => `  ${r.errors.map(e => `${e.file}: ${e.details}`).join('\n  ')}`)
        .join('\n')}\n`
    : ''
}

${
  recovered.length > 0
    ? `Successfully Recovered (${recovered.length}):\n${recovered
        .map(r => `  ${r.errors[0].file}`)
        .join('\n')}\n`
    : ''
}

${
  failed.length > 0
    ? `Recovery Failures (${failed.length}):\n${failed
        .map(r => `  ${r.errors[0].file}: ${r.errors[0].details}`)
        .join('\n')}`
    : ''
}
    `.trim();

    return report;
  }
}

export { FileValidator, ValidationError, FileCheckResult };
