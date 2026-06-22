// Second Brain CLI - Command interface
// Usage: ts-node cli.ts <command> [args]

import * as secondBrain from './orchestrator';
import { generateGameBlueprint } from './gameFactory';

const commands: Record<string, Function> = {
  // Cognitive commands
  decide: (args: string[]) => {
    const [question, choice, reason] = args;
    if (!question || !choice) {
      console.log('Usage: decide <question> <choice> <reason>');
      return;
    }
    secondBrain.recordDecision(question, choice, reason);
    console.log('Decision recorded');
  },
  
  search: (args: string[]) => {
    const query = args.join(' ');
    if (!query) {
      console.log('Usage: search <query>');
      return;
    }
    const decisions = secondBrain.searchDecisions(query);
    console.log('Found', decisions.length, 'decisions');
    for (const d of decisions) {
      console.log(`- ${d.choice}: ${d.reason}`);
    }
  },
  
  todo: (args: string[]) => {
    const [task, context] = args;
    if (!task) {
      console.log('Usage: todo <task> [context]');
      return;
    }
    secondBrain.addTodo(task, context || '');
    console.log('TODO added');
  },
  
  todos: () => {
    const todos = secondBrain.getActiveTodos();
    console.log('Active TODOs:', todos.length);
    for (const t of todos.slice(0, 10)) {
      console.log(`- [${t.status}] ${t.task} (${t.priority})`);
    }
  },
  
  error: (args: string[]) => {
    const [error, context] = args;
    if (!error) {
      console.log('Usage: error <message> [context]');
      return;
    }
    secondBrain.recordError(error, context || 'cli');
    console.log('Error recorded');
  },
  
  errors: () => {
    const errors = secondBrain.getRecentErrors();
    console.log('Active errors:', errors.length);
    for (const e of errors) {
      console.log(`- ${e.error.substring(0, 60)}...`);
    }
  },
  
  trust: () => {
    const score = secondBrain.getTrustScore();
    console.log('Trust score:', (score * 100).toFixed(1) + '%');
  },
  
  // Context commands
  template: (args: string[]) => {
    const name = args.join(' ');
    const tpl = secondBrain.getTemplate(name);
    if (tpl) {
      console.log(`Name: ${tpl.name}`);
      console.log(`Template: ${tpl.template}`);
      console.log(`Temperature: ${tpl.temperature}`);
    } else {
      console.log('Template not found');
    }
  },
  
  // Security commands
  secrets: async () => {
    const hasSecrets = secondBrain.hasSecrets();
    console.log('Secrets found:', hasSecrets);
  },
  
  // Process commands
  latency: () => {
    const latency = secondBrain.getValidationLatency();
    console.log('Validation latency:');
    console.log('  Avg:', latency.avg.toFixed(0), 'ms');
    console.log('  p95:', latency.p95.toFixed(0), 'ms');
  },
  
  // Delivery commands
  flag: (args: string[]) => {
    const [name, enabled] = args;
    if (!name) {
      console.log('Usage: flag <name> [true|false]');
      return;
    }
    secondBrain.setFeatureFlag(name, enabled === 'true');
    console.log('Flag set');
  },
  
  // Snapshot commands
  snapshot: async () => {
    const snap = secondBrain.getLatestSnapshot();
    if (snap) {
      console.log(snap.summary);
    } else {
      console.log('No snapshot found');
    }
  },

  game: async (args: string[]) => {
    const goal = args.join(' ').trim();
    const result = await generateGameBlueprint({
      goal: goal || undefined,
    });

    console.log('Game factory blueprint generated');
    console.log(JSON.stringify({
      goal: result.blueprint.goal,
      status: result.blueprint.status,
      provider: result.blueprint.provider,
      firstIncrement: result.blueprint.firstIncrement,
      tasks: result.blueprint.tasks,
    }, null, 2));
  },
  
  // Help
  help: () => {
    console.log('Commands:');
    console.log('  decide <q> <c> <r> - Record decision');
    console.log('  search <query>      - Search decisions');
    console.log('  todo <task> [ctx]  - Add TODO');
    console.log('  todos             - List TODOs');
    console.log('  error <msg> [ctx]  - Record error');
    console.log('  errors            - List errors');
    console.log('  trust            - Show trust score');
    console.log('  template <name>   - Get template');
    console.log('  secrets          - Check secrets');
    console.log('  latency          - Show validation latency');
    console.log('  flag <name>     - Set feature flag');
    console.log('  snapshot         - Show latest snapshot');
    console.log('  game [goal]      - Generate game factory blueprint');
  }
};

async function main() {
  await secondBrain.init();
  
  const cmd = process.argv[2];
  const args = process.argv.slice(3);
  
  if (commands[cmd]) {
    await commands[cmd](args);
  } else if (cmd) {
    console.log('Unknown command:', cmd);
    console.log('Run "help" for commands');
  } else {
    commands.help();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
