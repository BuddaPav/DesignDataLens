// Second Brain Main Entry Point
// Exports all systems for external use

export * from './orchestrator';
export * from './autonomous';

import { init as initOrchestrator } from './orchestrator';
import { init as initAutonomous } from './autonomous';

export async function initSecondBrain(mode: 'full' | 'memory' | 'autonomous' = 'full'): Promise<void> {
  console.log('[secondbrain] Initializing in', mode, 'mode');
  
  if (mode === 'full' || mode === 'memory') {
    await initOrchestrator();
  }
  
  if (mode === 'full' || mode === 'autonomous') {
    await initOrchestrator();
  }
  
  console.log('[secondbrain] Ready');
}

// Run if called directly
if (require.main === module) {
  const mode = process.argv[2] as 'full' | 'memory' | 'autonomous' || 'full';
  initSecondBrain(mode).catch(console.error);
}
