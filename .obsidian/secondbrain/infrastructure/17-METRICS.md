---
tags: [knowledge, analytics]
type: metrics-encyclopedia
created: 2026-06-20
updated: 2026-06-20
---
# Metrics Encyclopedia

## Retention Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| D1 | Return after 1 day | 45% |
| D7 | Return after 7 days | 15% |
| D30 | Return after 30 days | 8% |

## Engagement Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Sessions/day | Average per user | 3+ |
| Session length | Average minutes | 25+ |
| Days retained | Days played | 7+ |

## Monetization Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Conversion | Free > Paid | 5%+ |
| ARPPU | Avg revenue per paying | $25+ |
| LTV | Lifetime value | $150+ |

## Technical Metrics

| Metric | Target |
|--------|--------|
| FPS | 60+ |
| Load time | < 3s |
| Crash rate | < 1% |
| Bug reports/day | < 5 |

## Event Tracking

```ts
// Track custom event
track('quest_complete', {
  questId: 'main_01',
  timeSpent: 3600,
  attempts: 3,
});
```

## Funnel Analysis

1. Install > Tutorial
2. First combat
3. First quest
4. First save
5. Return D1
