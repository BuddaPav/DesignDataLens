/**
 * Obsidian MCP Integration Script
 * Подключается к локальному Obsidian MCP серверу для управления заметками.
 *
 * Запуск: node scripts/obsidian-integration.mjs <command> [args]
 * Commands:
 *   search <query>    - Search notes
 *   create <path>     - Create new note
 *   read <path>       - Read note content
 *   list              - List all notes
 */

import { stdin as input, stdout as output } from 'process';
import http from 'http';

// Obsidian MCP config
const MCP_HOST = 'localhost';
const MCP_PORT = 27124;
const API_KEY = '581978cf868e642567bf70764f372740f33e683112ebdcae1d005d44ed1177c5';

/**
 * Make MCP request
 */
function mcpRequest(method, params = {}) {
  return new Promise((resolve, reject) => {
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    const options = {
      hostname: MCP_HOST,
      port: MCP_PORT,
      path: '/',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(payload))
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Parse error: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

/**
 * Execute command
 */
async function main() {
  const command = process.argv[2];
  const args = process.argv.slice(3);

  try {
    let result;
    switch (command) {
      case 'search':
        result = await mcpRequest('search', { query: args.join(' ') });
        console.log('Search results:', JSON.stringify(result, null, 2));
        break;

      case 'create':
        await mcpRequest('create_note', { path: args[0], content: args[1] || '' });
        console.log('Note created:', args[0]);
        break;

      case 'read':
        result = await mcpRequest('read_note', { path: args[0] });
        console.log(result.result?.content || result);
        break;

      case 'list':
        result = await mcpRequest('list_notes');
        console.log('Notes:', JSON.stringify(result, null, 2));
        break;

      default:
        console.log('Usage: node obsidian-integration.mjs <command> [args]');
        console.log('Commands: search, create, read, list');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();