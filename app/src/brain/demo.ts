/**
 * Brain CLI Demo
 *
 * Simple CLI demo for the "Второй Мозг" Brain system.
 * Run with: npx ts-node app/src/brain/demo.ts
 */

import { Brain } from './brain';
import type { BrainRequest } from './brain';

/**
 * Demo function to test the Brain
 */
async function demo() {
  console.log('🧠 Второй Мозг - Brain System Demo');
  console.log('='.repeat(40));

  // Create Brain
  const brain = new Brain();
  await brain.initialize();

  console.log('✅ Brain initialized');
  console.log('');

  // Test cases
  const testCases: BrainRequest[] = [
    {
      input: 'Create a class Player with health, mana, and attack properties',
      type: 'code',
    },
    {
      input: 'Add a function to calculate damage based on attack power',
      type: 'code',
    },
    {
      input: 'Create an NPC that sells items to players',
      type: 'code',
    },
  ];

  for (let i = 0; i < testCases.length; i++) {
    const request = testCases[i];
    console.log(`\n📝 Test ${i + 1}: ${request.input.slice(0, 50)}...`);

    const response = await brain.process(request);

    console.log(`   Success: ${response.success ? '✅' : '❌'}`);
    console.log(`   Confidence: ${(response.confidence * 100).toFixed(1)}%`);
    console.log(`   Latency: ${response.latency}ms`);
    console.log(`   Model: ${response.metadata.model}`);

    if (response.content) {
      console.log(`   Output: ${response.content.slice(0, 100)}...`);
    }

    if (response.classification) {
      console.log(`   Complexity: ${response.classification.complexity}/5`);
      console.log(`   Category: ${response.classification.category}`);
      console.log(`   Keywords: ${response.classification.keywords.slice(0, 5).join(', ')}`);
    }
  }

  // Test memory retrieval
  console.log('\n' + '='.repeat(40));
  console.log('🧪 Testing Memory (RAG)');

  const memoryResults = await brain.retrieveMemory('Player class', 3);
  console.log(`Found ${memoryResults.length} related memories`);

  for (const result of memoryResults) {
    console.log(`   - Score: ${(result.score * 100).toFixed(1)}%`);
  }

  // Test verification
  console.log('\n' + '='.repeat(40));
  console.log('🧪 Testing Verification');

  const testCode = `
class Player {
  name: string;
  health: number;
  mana: number;

  constructor(name: string) {
    this.name = name;
    this.health = 100;
    this.mana = 50;
  }

  takeDamage(amount: number): void {
    this.health -= amount;
  }
}
`.trim();

  const verifyResult = await brain.verify(testCode);
  console.log(`Verification: ${verifyResult.passed ? '✅ Passed' : '❌ Failed'}`);
  console.log(`Score: ${(verifyResult.score * 100).toFixed(1)}%`);

  for (const check of verifyResult.checks) {
    console.log(`   ${check.passed ? '✓' : '✗'} ${check.check}: ${check.message || 'passed'}`);
  }

  // Get system status
  console.log('\n' + '='.repeat(40));
  console.log('📊 System Status');

  const status = brain.getStatus();
  console.log(`   Initialized: ${status.initialized}`);
  console.log(`   Context Tokens: ${status.contextTokens}`);
  console.log(`   Memory Entries: ${status.memoryEntries}`);
  console.log(`   Hallucination Rate: ${(status.hallucinationRate * 100).toFixed(1)}%`);

  // Cleanup
  await brain.cleanup();

  console.log('\n✅ Demo complete');
}

// Run if executed directly
if (require.main === module) {
  demo().catch(console.error);
}

export { demo };