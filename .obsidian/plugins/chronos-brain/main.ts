// Chronos Brain - Obsidian Plugin
// Second Brain для автономного создания AAA игры

import { Plugin, TFile, TFolder, App } from 'obsidian';

// Types
interface BrainTask {
  id: string;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  context: string;
}

interface BrainMetrics {
  trustScore: number;
  activeTasks: number;
  errors: number;
  cycleCount: number;
  lastRun: number;
}

export default class ChronosBrainPlugin extends Plugin {
  private statusEl: HTMLElement | null = null;
  private metrics: BrainMetrics = {
    trustScore: 1.0,
    activeTasks: 0,
    errors: 0,
    cycleCount: 0,
    lastRun: 0
  };
  private isRunning = false;
  private intervalId: number | null = null;

  async onload() {
    console.log('[Chronos Brain] Plugin loaded');

    // Add command palette command
    this.addCommand({
      id: 'start-chronos-brain',
      name: 'Start Chronos Brain Agent',
      callback: () => this.startAgent()
    });

    this.addCommand({
      id: 'stop-chronos-brain',
      name: 'Stop Chronos Brain Agent',
      callback: () => this.stopAgent()
    });

    // Create status bar item
    this.statusEl = this.addStatusBarItem();
    this.statusEl.setText('🧠 Brain: Ready');
    this.statusEl.addClass('chronos-brain-status');

    // AddRibbon
    this.addRibbonIcon('brain', 'Chronos Brain', () => {
      this.showPanel();
    });

    // Add view
    this.registerView('chronos-brain', (leaf) => new BrainView(leaf, this));

    // Load metrics
    await this.loadMetrics();
  }

  onunload() {
    console.log('[Chronos Brain] Plugin unloaded');
    this.stopAgent();
  }

  async showPanel() {
    // Switch or create view
    const leaves = this.app.workspace.getLeavesOfType('chronos-brain');
    if (leaves.length === 0) {
      await this.app.workspace.getLeaf('right').setViewState({
        type: 'chronos-brain'
      });
    } else {
      this.app.workspace.revealLeaf(leaves[0]);
    }
  }

  async startAgent() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateStatus('Running');

    console.log('[Chronos Brain] Agent starting...');
    // Use subprocess to run autonomous agent
    const { spawn } = require('child_process');
    try {
      spawn('npx', ['tsx', 'ai_support/secondbrain/autonomous.ts'], {
        cwd: 'c:/Users/Den/Downloads/AFK Game',
        detached: true,
        stdio: 'ignore'
      }).unref();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to start';
      console.error('[Chronos Brain] Failed to start agent:', msg);
    }
    await this.runCycle();
  }

  async stopAgent() {
    this.isRunning = false;
    this.updateStatus('Stopped');

    console.log('[Chronos Brain] Agent stopped');
  }

  private updateStatus(status: string) {
    if (this.statusEl) {
      const icon = status === 'Running' ? '🧠' : '💤';
      this.statusEl.setText(`${icon} Brain: ${status}`);
    }
  }

  async runCycle() {
    if (!this.isRunning) return;

    this.metrics.cycleCount++;
    this.metrics.lastRun = Date.now();

    console.log(`[Chronos Brain] Cycle ${this.metrics.cycleCount}`);

    // TODO: Integrate with autonomous.ts
    // - Check build
    // - Run tests
    // - Analyze code with LLM
    // - Apply fixes

    await this.saveMetrics();

    // Continue cycle
    if (this.isRunning) {
      setTimeout(() => this.runCycle(), 30000);
    }
  }

  async loadMetrics() {
    try {
      const file = this.app.vault.getAbstractFileByPath('.obsidian/secondbrain/metrics.json');
      if (file) {
        const content = await this.app.vault.read(file as TFile);
        const data = JSON.parse(content);
        this.metrics = { ...this.metrics, ...data };
      }
    } catch (e) {
      console.log('[Chronos Brain] No metrics file');
    }
  }

  async saveMetrics() {
    try {
      let file = this.app.vault.getAbstractFileByPath('.obsidian/secondbrain/metrics.json') as TFile;
      if (!file) {
        file = await this.app.vault.create('.obsidian/secondbrain/metrics.json', JSON.stringify(this.metrics));
      } else {
        await this.app.vault.modify(file as TFile, JSON.stringify(this.metrics, null, 2));
      }
    } catch (e) {
      console.error('[Chronos Brain] Save metrics error:', e);
    }
  }

  getMetrics() {
    return this.metrics;
  }

  isAgentRunning() {
    return this.isRunning;
  }
}

// Simple view showing panel
class BrainView {
  constructor(leaf: any, plugin: ChronosBrainPlugin) {
    this.plugin = plugin;
    this.leaf = leaf;
    this.render();
  }

  private plugin: ChronosBrainPlugin;
  private leaf: any;
  private logs: string[] = [];

  appendLog(msg: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.logs.push(`[${timestamp}] ${msg}`);
    if (this.logs.length > 100) this.logs.shift();
    const logEl = this.leaf.view.contentEl.querySelector('#log-content');
    if (logEl) logEl.textContent = this.logs.join('\n');
  }

  render() {
    const el = this.leaf.view.contentEl;
    el.innerHTML = `
      <div class="chronos-brain-panel">
        <h2>🧠 Chronos Brain</h2>
        <div class="metrics">
          <div class="metric">
            <span class="label">Trust Score:</span>
            <span class="value" id="trust-score">${this.plugin.getMetrics().trustScore}</span>
          </div>
          <div class="metric">
            <span class="label">Cycles:</span>
            <span class="value" id="cycles">${this.plugin.getMetrics().cycleCount}</span>
          </div>
          <div class="metric">
            <span class="label">Status:</span>
            <span class="value" id="status">${this.plugin.isAgentRunning() ? 'Running' : 'Stopped'}</span>
          </div>
        </div>
        <div class="controls">
          <button id="start-btn">Start</button>
          <button id="stop-btn">Stop</button>
          <button id="build-btn">Build</button>
          <button id="test-btn">Test</button>
        </div>
        <div class="logs">
          <h3>Logs</h3>
          <div id="log-content"></div>
        </div>
      </div>
    `;

    // Add event listeners
    el.querySelector('#start-btn')?.addEventListener('click', () => {
      this.plugin.startAgent();
      this.render();
    });

    el.querySelector('#stop-btn')?.addEventListener('click', () => {
      this.plugin.stopAgent();
      this.render();
    });

    el.querySelector('#build-btn')?.addEventListener('click', async () => {
      this.appendLog('Starting build...');
      // Use subprocess via Obsidian's native run instead
      const { execSync } = require('child_process');
      try {
        execSync('cd "c:/Users/Den/Downloads/AFK Game/app" && npm run build', {
          stdio: 'pipe',
          timeout: 120000
        });
        this.appendLog('Build: PASS');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Build failed';
        this.appendLog(`Build: FAIL - ${msg.substring(0, 100)}`);
      }
    });

    el.querySelector('#test-btn')?.addEventListener('click', async () => {
      this.appendLog('Starting tests...');
      // Use subprocess via app
      const { execSync } = require('child_process');
      try {
        execSync('cd "c:/Users/Den/Downloads/AFK Game/app" && npm test', {
          stdio: 'pipe',
          timeout: 120000
        });
        this.appendLog('Tests: PASS');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Tests failed';
        this.appendLog(`Tests: FAIL - ${msg.substring(0, 100)}`);
      }
    });
  }
}