// Chronos Second Brain - Main Orchestrator
// Autonomously manages all 13 layers of AI development memory

import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';

const BASE_DIR = './ai_support/secondbrain';

// Load API keys from .env.api
function loadEnvFile(): void {
  const envPath = path.join(BASE_DIR, '.env.api');
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim();

    if (key && value) {
      process.env[key] = value;
    }
  }
}
loadEnvFile();

// Layer interfaces
interface Decision {
  id: string;
  question: string;
  choice: string;
  reason: string;
  alternatives: string[];
  timestamp: number;
  tags: string[];
}

interface TodoItem {
  id: string;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  priority: number;
  context: string;
  errorState?: string;
  timestamp: number;
}

interface ErrorState {
  id: string;
  error: string;
  stack?: string;
  context: string;
  resolution?: string;
  timestamp: number;
  resolved: boolean;
}

interface TrustMetric {
  hallucinations: number;
  verifiedSnippets: number;
  totalGenerations: number;
  score: number;
}

// Core state
let decisions: Decision[] = [];
let todos: TodoItem[] = [];
let errors: ErrorState[] = [];
let trustScore: TrustMetric = { hallucinations: 0, verifiedSnippets: 0, totalGenerations: 0, score: 1.0 };
let flowState = { inFlow: false, lastActivity: 0, recoveryTime: 15000 };
const emitter = new EventEmitter();

// File helpers
function ensureDir(rel: string) {
  const dir = path.join(BASE_DIR, rel);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJson(rel: string, def: object): object {
  const file = path.join(BASE_DIR, rel);
  try {
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : def;
  } catch { return def; }
}

function saveJson(rel: string, data: object) {
  ensureDir(path.dirname(rel));
  fs.writeFileSync(path.join(BASE_DIR, rel), JSON.stringify(data, null, 2));
}

export async function initSecondBrain(): Promise<void> {
  console.log('[secondbrain] Initializing orchestrator...');
  
  ensureDir('cognitive');
  ensureDir('infrastructure');
  ensureDir('context');
  ensureDir('artifacts');
  ensureDir('process');
  ensureDir('security');
  ensureDir('observability');
  ensureDir('data');
  ensureDir('delivery');
  ensureDir('network');
  ensureDir('communication');
  ensureDir('epistemic');
  
  // Load existing state
  decisions = loadJson('cognitive/decisions.json', []) as Decision[];
  todos = loadJson('cognitive/todos.json', []) as TodoItem[];
  errors = loadJson('cognitive/errors.json', []) as ErrorState[];
  trustScore = loadJson('cognitive/trust.json', trustScore) as TrustMetric;
  
  console.log('[secondbrain] Ready. Decisions:', decisions.length, '| TODOs:', todos.length);
  emitter.emit('ready');
}

// === COGNITIVE LAYER (Layer 1) ===

export function recordDecision(question: string, choice: string, reason: string, alternatives: string[] = [], tags: string[] = []): Decision {
  const decision: Decision = {
    id: `d${Date.now()}`,
    question, choice, reason, alternatives, tags, timestamp: Date.now()
  };
  decisions.push(decision);
  saveJson('cognitive/decisions.json', decisions);
  emitter.emit('decision', decision);
  return decision;
}

export function searchDecisions(query: string): Decision[] {
  const q = query.toLowerCase();
  return decisions.filter(d => 
    d.question.toLowerCase().includes(q) ||
    d.choice.toLowerCase().includes(q) ||
    d.reason.toLowerCase().includes(q) ||
    d.tags.some(t => t.toLowerCase().includes(q))
  ).slice(-10);
}

export function addTodo(task: string, context: string, priority = 5): TodoItem {
  const todo: TodoItem = {
    id: `t${Date.now()}`,
    task, status: 'pending', priority, context, timestamp: Date.now()
  };
  todos.push(todo);
  todos.sort((a, b) => b.priority - a.priority);
  saveJson('cognitive/todos.json', todos);
  return todo;
}

export function updateTodo(id: string, status: TodoItem['status'], errorState?: string): TodoItem | null {
  const todo = todos.find(t => t.id === id);
  if (todo) {
    todo.status = status;
    if (errorState) todo.errorState = errorState;
    saveJson('cognitive/todos.json', todos);
  }
  return todo || null;
}

export function getActiveTodos(): TodoItem[] {
  return todos.filter(t => t.status === 'pending' || t.status === 'in_progress');
}

export function recordError(error: string, context: string, stack?: string): ErrorState {
  const err: ErrorState = {
    id: `e${Date.now()}`,
    error, context, stack, timestamp: Date.now(), resolved: false
  };
  errors.push(err);
  saveJson('cognitive/errors.json', errors);
  
  // Update flow recovery time
  flowState.inFlow = false;
  flowState.lastActivity = Date.now();
  
  emitter.emit('error', err);
  return err;
}

export function resolveError(id: string, resolution: string): ErrorState | null {
  const err = errors.find(e => e.id === id);
  if (err) {
    err.resolved = true;
    err.resolution = resolution;
    saveJson('cognitive/errors.json', errors);
  }
  return err || null;
}

export function getRecentErrors(): ErrorState[] {
  return errors.filter(e => !e.resolved).slice(-5);
}

// Flow recovery
export function enterFlow(): void {
  flowState.inFlow = true;
  flowState.lastActivity = Date.now();
  emitter.emit('flow', true);
}

export function checkFlowRecovery(): number {
  if (flowState.inFlow) return 0;
  const elapsed = Date.now() - flowState.lastActivity;
  return Math.max(0, flowState.recoveryTime - elapsed);
}

// Trust score
export function recordGeneration(): void {
  trustScore.totalGenerations++;
  saveJson('cognitive/trust.json', trustScore);
}

export function recordHallucination(): void {
  trustScore.hallucinations++;
  trustScore.score = (trustScore.totalGenerations - trustScore.hallucinations) / trustScore.totalGenerations;
  saveJson('cognitive/trust.json', trustScore);
}

export function recordVerified(): void {
  trustScore.verifiedSnippets++;
  saveJson('cognitive/trust.json', trustScore);
}

export function getTrustScore(): number {
  return trustScore.score;
}

// === INFRASTRUCTURE LAYER (Layer 2) ===

interface IndexEntry {
  id: string;
  content: string;
  embedding?: number[];
  path: string;
  type: string;
  timestamp: number;
}

let index: IndexEntry[] = [];

export async function initInfrastructure(): Promise<void> {
  index = loadJson('infrastructure/index.json', []) as IndexEntry[];
  console.log('[secondbrain] Infra ready. Indexed:', index.length);
}

export function indexFile(filePath: string, content: string, type: string): IndexEntry {
  const entry: IndexEntry = {
    id: `i${Date.now()}`,
    content: content.substring(0, 10000),
    path: filePath,
    type,
    timestamp: Date.now()
  };
  index.push(entry);
  saveJson('infrastructure/index.json', index);
  return entry;
}

export function searchSemantic(query: string): IndexEntry[] {
  const q = query.toLowerCase();
  return index.filter(e => 
    e.content.toLowerCase().includes(q) ||
    e.path.toLowerCase().includes(q)
  ).slice(0, 5);
}

// === CONTEXT LAYER (Layer 3) ===

export interface PromptTemplate {
  id: string;
  name: string;
  template: string;
  temperature: number;
  tags: string[];
}

let templates: PromptTemplate[] = [];

export async function initContext(): Promise<void> {
  templates = loadJson('context/templates.json', []) as PromptTemplate[];
  
  if (templates.length === 0) {
    templates = [
      { id: 'tpl_crud', name: 'CRUD Operation', template: 'Create {entity} with fields: {fields}. Add validation.', temperature: 0.1, tags: ['crud', 'backend'] },
      { id: 'tpl_middleware', name: 'Middleware', template: 'Write middleware for {purpose} with error handling.', temperature: 0.1, tags: ['middleware', 'backend'] },
      { id: 'tpl_ui_component', name: 'UI Component', template: 'Build React component for {element} with {style} styles.', temperature: 0.7, tags: ['ui', 'frontend'] },
      { id: 'tpl_error_handler', name: 'Error Handler', template: 'Handle {errorType} errors with logging and user feedback.', temperature: 0.2, tags: ['errors', 'backend'] },
      { id: 'tpl_test', name: 'Test Spec', template: 'Write test for {function} covering {cases}.', temperature: 0.3, tags: ['test', 'quality'] }
    ];
    saveJson('context/templates.json', templates);
  }
  
  console.log('[secondbrain] Context ready. Templates:', templates.length);
}

export function getTemplate(name: string): PromptTemplate | undefined {
  return templates.find(t => t.name.toLowerCase().includes(name.toLowerCase()));
}

export function searchTemplates(tags: string[]): PromptTemplate[] {
  return templates.filter(t => tags.some(tag => t.tags.includes(tag)));
}

// === ARTIFACTS LAYER (Layer 4) ===

export interface ADR {
  id: string;
  title: string;
  decision: string;
  consequences: string[];
  status: 'proposed' | 'accepted' | 'deprecated';
  timestamp: number;
}

let adrs: ADR[] = [];

interface PostMortem {
  id: string;
  incident: string;
  rootCause: string;
  fix: string;
  lessons: string[];
  timestamp: number;
}

let postMortems: PostMortem[] = [];

export async function initArtifacts(): Promise<void> {
  adrs = loadJson('artifacts/adrs.json', []) as ADR[];
  postMortems = loadJson('artifacts/postmortems.json', []) as PostMortem[];
  console.log('[secondbrain] Artifacts ready. ADRs:', adrs.length);
}

export function addADR(title: string, decision: string, consequences: string[]): ADR {
  const adr: ADR = {
    id: `adr${adrs.length + 1}`,
    title, decision, consequences, status: 'accepted', timestamp: Date.now()
  };
  adrs.push(adr);
  saveJson('artifacts/adrs.json', adrs);
  return adr;
}

export function getADR(id: string): ADR | undefined {
  return adrs.find(a => a.id === id);
}

export function addPostMortem(incident: string, rootCause: string, fix: string, lessons: string[]): PostMortem {
  const pm: PostMortem = {
    id: `pm${Date.now()}`,
    incident, rootCause, fix, lessons, timestamp: Date.now()
  };
  postMortems.push(pm);
  saveJson('artifacts/postmortems.json', postMortems);
  return pm;
}

export function searchPostMortems(query: string): PostMortem[] {
  const q = query.toLowerCase();
  return postMortems.filter(p => 
    p.incident.toLowerCase().includes(q) || 
    p.rootCause.toLowerCase().includes(q)
  ).slice(-5);
}

// === PROCESS LAYER (Layer 5) ===

export interface ValidationResult {
  id: string;
  type: 'compile' | 'lint' | 'test' | 'security' | 'build';
  status: 'pass' | 'fail';
  errors: string[];
  latency: number;
  timestamp: number;
}

let validations: ValidationResult[] = [];

export async function initProcess(): Promise<void> {
  validations = loadJson('process/validations.json', []) as ValidationResult[];
  console.log('[secondbrain] Process ready');
}

export function recordValidation(type: ValidationResult['type'], status: ValidationResult['status'], errors: string[], latency: number): ValidationResult {
  const result: ValidationResult = {
    id: `v${Date.now()}`,
    type, status, errors, latency, timestamp: Date.now()
  };
  validations.push(result);
  saveJson('process/validations.json', validations);
  
  if (status === 'fail' && type === 'compile') {
    recordError(errors.join('; '), type);
  }
  
  return result;
}

export function getValidationLatency(): { avg: number; p95: number } {
  const recent = validations.slice(-20);
  if (recent.length === 0) return { avg: 0, p95: 0 };
  const latencies = recent.map(v => v.latency).sort((a, b) => a - b);
  const sum = latencies.reduce((a, b) => a + b, 0);
  return {
    avg: sum / latencies.length,
    p95: latencies[Math.floor(latencies.length * 0.95)] || 0
  };
}

// === SECURITY LAYER (Layer 7) ===

export interface Vulnerability {
  id: string;
  cve?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'open' | 'fixed' | 'accepted';
  timestamp: number;
}

let vulnerabilities: Vulnerability[] = [];

interface SecretScan {
  file: string;
  line?: number;
  type: string;
  exported: boolean;
  timestamp: number;
}

let secretScans: SecretScan[] = [];

export async function initSecurity(): Promise<void> {
  vulnerabilities = loadJson('security/vulnerabilities.json', []) as Vulnerability[];
  secretScans = loadJson('security/secrets.json', []) as SecretScan[];
  console.log('[secondbrain] Security ready');
}

export function recordVulnerability(severity: Vulnerability['severity'], description: string, cve?: string): Vulnerability {
  const vuln: Vulnerability = {
    id: `vuln${Date.now()}`,
    severity, description, cve, status: 'open', timestamp: Date.now()
  };
  vulnerabilities.push(vuln);
  saveJson('security/vulnerabilities.json', vulnerabilities);
  return vuln;
}

export function recordSecretScan(file: string, type: string, exported: boolean, line?: number): void {
  secretScans.push({ file, type, exported, line, timestamp: Date.now() });
  saveJson('security/secrets.json', secretScans);
}

export function hasSecrets(): boolean {
  return secretScans.some(s => !s.exported);
}

// === DELIVERY LAYER (Layer 10) ===

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rollout: number;
  dependencies: string[];
  timestamp: number;
}

let featureFlags: FeatureFlag[] = [];

export async function initDelivery(): Promise<void> {
  featureFlags = loadJson('delivery/flags.json', []) as FeatureFlag[];
  console.log('[secondbrain] Delivery ready');
}

export function setFeatureFlag(name: string, enabled: boolean, rollout = 100, dependencies: string[] = []): FeatureFlag {
  let flag = featureFlags.find(f => f.name === name);
  if (flag) {
    flag.enabled = enabled;
    flag.rollout = rollout;
  } else {
    flag = { name, enabled, rollout, dependencies, timestamp: Date.now() };
    featureFlags.push(flag);
  }
  saveJson('delivery/flags.json', featureFlags);
  return flag;
}

export function isFeatureEnabled(name: string): boolean {
  const flag = featureFlags.find(f => f.name === name);
  return flag?.enabled ?? false;
}

// === COMMUNICATION LAYER (Layer 12) ===
interface OnboardingSnapshot {
  id: string;
  summary: string;
  architecture: string;
  keyFiles: string[];
  conventions: string[];
  timestamp: number;
}

let snapshots: OnboardingSnapshot[] = [];

export async function initCommunication(): Promise<void> {
  snapshots = loadJson('communication/snapshots.json', []) as OnboardingSnapshot[];
  console.log('[secondbrain] Communication ready');
}

export function createSnapshot(summary: string, architecture: string, keyFiles: string[], conventions: string[]): OnboardingSnapshot {
  const snap: OnboardingSnapshot = {
    id: `snap${Date.now()}`,
    summary, architecture, keyFiles, conventions, timestamp: Date.now()
  };
  snapshots.push(snap);
  saveJson('communication/snapshots.json', snapshots);
  return snap;
}

export function getLatestSnapshot(): OnboardingSnapshot | undefined {
  return snapshots[snapshots.length - 1];
}

// === API KEYS LAYER ===

export interface APIKeyStatus {
  provider: string;
  configured: boolean;
  lastUsed?: number;
}

let apiKeys: Map<string, APIKeyStatus> = new Map();

// Load API keys from environment
export async function initAPIKeys(): Promise<void> {
  apiKeys.clear();

  // HuggingFace
  const hfToken = process.env.HF_TOKEN || '';
  apiKeys.set('huggingface', { provider: 'huggingface', configured: !!hfToken });

  // Telegram
  const tgToken = process.env.TELEGRAM_BOT_TOKEN || '';
  apiKeys.set('telegram', { provider: 'telegram', configured: !!tgToken });

  // Yandex
  const yandexKey = process.env.YANDEX_API_KEY || '';
  apiKeys.set('yandex', { provider: 'yandex', configured: !!yandexKey });

  console.log('[secondbrain] API keys loaded:', Array.from(apiKeys.keys()).join(', '));
}

export function getAPIKeyStatus(provider: string): APIKeyStatus | undefined {
  return apiKeys.get(provider);
}

export function isAPIReady(provider: string): boolean {
  const status = apiKeys.get(provider);
  return status?.configured ?? false;
}

export function getConfiguredAPIs(): string[] {
  return Array.from(apiKeys.entries())
    .filter(([_, status]) => status.configured)
    .map(([provider]) => provider);
}

// === MAIN INIT ===

export async function init(): Promise<void> {
  await initSecondBrain();
  await initInfrastructure();
  await initContext();
  await initArtifacts();
  await initProcess();
  await initSecurity();
  await initDelivery();
  await initCommunication();
  await initAPIKeys();

  console.log('[secondbrain] Full system initialized');
}

// Export for orchestrator
export const secondBrain = {
  init,
  // Cognitive
  recordDecision, searchDecisions,
  addTodo, updateTodo, getActiveTodos,
  recordError, resolveError, getRecentErrors,
  enterFlow, checkFlowRecovery,
  getTrustScore, recordGeneration, recordHallucination, recordVerified,
  // Infrastructure
  indexFile, searchSemantic,
  // Context
  getTemplate, searchTemplates,
  // Artifacts
  addADR, getADR, addPostMortem, searchPostMortems,
  // Process
  recordValidation, getValidationLatency,
  // Security
  recordVulnerability, recordSecretScan, hasSecrets,
  // Delivery
  setFeatureFlag, isFeatureEnabled,
  // Communication
  createSnapshot, getLatestSnapshot,
  // API Keys
  initAPIKeys, getAPIKeyStatus, isAPIReady, getConfiguredAPIs,
  // Events
  on: (event: string, fn: (...args: any[]) => void) => emitter.on(event, fn),
  off: (event: string, fn: (...args: any[]) => void) => emitter.off(event, fn)
};

export default secondBrain;
