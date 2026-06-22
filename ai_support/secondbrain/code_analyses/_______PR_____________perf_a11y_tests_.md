# Шаблон PR с чеклистом perf/a11y/tests.

```typescript
```typescript
interface PullRequestTemplate {
  title: string;
  description?: string;
  types: string[];
  breakingChanges?: boolean;
  tests: boolean;
  accessibility: boolean;
  performance: boolean;
}

const PR_TEMPLATE: PullRequestTemplate = {
  title: "TypeScript/React PR Template",
  description: "Please ensure your pull request adheres to the following guidelines:",
  types: ["Bug fix", "Feature", "Refactor", "Documentation"],
  breakingChanges: false,
  tests: true,
  accessibility: true,
  performance: true
};

function generatePRTemplate(prTemplate: PullRequestTemplate): string {
  return `
# ${prTemplate.title}

${prTemplate.description || ""}

### Types:
- [ ] Bug fix
- [ ] Feature
- [ ] Refactor
- [ ] Documentation

### Breaking Changes:
- [ ] Yes (describe the breaking change)
- [ ] No

### Tests:
- [ ] Added tests for new functionality
- [ ] Updated existing tests if necessary

### Accessibility:
- [ ] Ensured accessibility compliance
- [ ] Tested with assistive technologies

### Performance:
- [ ] Optimized performance where applicable
- [ ] Tested for any regressions in performance
  `;
}

console.log(generatePRTemplate(PR_TEMPLATE));
```
```

Generated: 2026-06-22T06:05:39.135Z