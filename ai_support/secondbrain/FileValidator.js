// FileValidator: Detects file corruption, duplicates
class FileValidator {
    // Check duplicate imports by full line only
    checkContent(filePath, content) {
        const errors = [];
        const lines = content.split('\n');
        // Check duplicate imports
        const importLines = lines.filter(l => l.match(/^import\s+.*from/));
        const seenImportLines = new Set();
        for (const line of importLines) {
            const normalized = line.trim();
            if (seenImportLines.has(normalized)) {
                errors.push(`Duplicate import line: "${normalized.slice(0, 50)}..."`);
            }
            seenImportLines.add(normalized);
        }
        // Check duplicate exports
        const exportMatches = content.match(/export\s+(function|const|class|type|interface)\s+(\w+)/g) || [];
        const exportCounts = new Map();
        for (const exp of exportMatches) {
            const nameMatch = exp.match(/export\s+(function|const|class|type|interface)\s+(\w+)/);
            if (nameMatch) {
                const name = nameMatch[2];
                exportCounts.set(name, (exportCounts.get(name) || 0) + 1);
            }
        }
        for (const [name, count] of exportCounts) {
            if (count > 1) {
                errors.push(`Duplicate export "${name}" (${count}x)`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
}
export { FileValidator };