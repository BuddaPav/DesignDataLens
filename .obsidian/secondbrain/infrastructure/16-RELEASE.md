---
tags: [knowledge, deployment]
type: deployment-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Deployment Encyclopedia

## Versioning (SemVer)

```
MAJOR.MINOR.PATCH
  ¦    ¦    L-- Bug fixes
  ¦    L------- New features (backward compatible)
  L---------- Breaking changes

1.0.0 > initial
1.1.0 > new feature
2.0.0 > breaking
```

## Release Channels

| Channel | Suffix | When |
|---------|--------|------|
| stable | none | Production |
| beta | -beta | Testing |
| dev | -dev | Development |

## Build Outputs

| Platform | Format | Output |
|----------|--------|--------|
| Web | ZIP | dist/ |
| Windows | .exe | desktop-dist/ |
| Windows | .installer | desktop-installer/ |

## Release Checklist

- [ ] Tests pass
- [ ] No TypeScript errors
- [ ] Security scan clean
- [ ] Bundle size < 500KB
- [ ] Version bumped
- [ ] Changelog updated

## Hotfix Process

```
1. Branch from tag
2. Fix bug
3. Test
4. Merge to main
5. Tag patch version
6. Build release
```

## Desktop Build

```bash
npm run desktop:pack    # ZIP
npm run desktop:installer  # NSIS installer
```

## Distribution

- Direct download (website)
- itch.io (future)
- Steam (future)
