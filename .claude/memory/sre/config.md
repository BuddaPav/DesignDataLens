# SRE (Site Reliability Engineering) Config

## SLI/SLO Targets
- **Application Load Time**: p95 < 2s
- **NPC Response Time**: p99 < 100ms
- **World Tick Rate**: 1 second (+/- 50ms)
- **Build Time**: < 30 seconds
- **Bundle Size**: < 500KB gzipped

## Alert Rules
```
Critical:
- Build fails → page immediately
- TypeScript errors appear → notify

Warning:
- Bundle > 500KB → warn
- API errors > 5% → warn
- FPS < 30 → warn
```

## Monitoring Points
- npm run build status
- TypeScript error count
- Bundle size
- Test coverage %
- Lighthouse score

## Chaos Scenarios
1. **NPC offline**: Disable all NPC for 1 minute
2. **Save failure**: Simulate write error
3. **Large inventory**: 1000+ items
4. **Many NPCs**: 50+ active NPCs

## Post-Mortem Triggers
- Build broken > 1 hour
- Production bug (if deployed)
- Security vulnerability detected