# Автогенерация `deps` графа при merge в main (по расписанию).

```typescript
```typescript
import { Project, Script } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: "tsconfig.json",
});

// Load the project files
project.addSourceFilesAtPaths("src/**/*.ts");

function generateDepsGraph() {
  const depsGraph: Record<string, string[]> = {};

  // Iterate over all source files in the project
  project.getSourceFiles().forEach(sourceFile => {
    const filePath = sourceFile.getFilePath();

    // Extract imports from the file
    const imports = sourceFile.getImportDeclarations()
      .map(imp => imp.getModuleSpecifierValue());

    depsGraph[filePath] = imports;
  });

  return depsGraph;
}

async function runScript() {
  const script = new Script();
  script.register("generateDepsGraph", generateDepsGraph);
  await script.run("generateDepsGraph");
}

// Schedule the script to run at a specific time (e.g., every day at midnight)
const cronTime = "0 0 * * *"; // Every day at midnight
const schedule = require('node-schedule');
schedule.scheduleJob(cronTime, runScript);
```
```

Generated: 2026-06-22T06:43:27.923Z