import { describe, expect, it } from 'vitest';

import { EcsLite, EventBus, ObjectPool, Sequence, StateMachine } from '@/scaffolds/index';

describe('scaffolds', () => {
  it('EventBus emits typed payload', () => {
    type E = { ping: { n: number } };
    const bus = new EventBus<E>();
    let n = 0;
    const off = bus.on('ping', (p) => {
      n = p.n;
    });
    bus.emit('ping', { n: 42 });
    expect(n).toBe(42);
    off();
    bus.emit('ping', { n: 0 });
    expect(n).toBe(42);
  });

  it('ObjectPool reuses instances', () => {
    let created = 0;
    const pool = new ObjectPool(
      () => {
        created += 1;
        return { x: 0 };
      },
      (o) => {
        o.x = 0;
      },
      4,
    );
    const a = pool.acquire();
    const b = pool.acquire();
    pool.release(a);
    pool.release(b);
    pool.acquire();
    pool.acquire();
    expect(created).toBe(2);
  });

  it('StateMachine transitions', () => {
    const sm = new StateMachine<'a' | 'b', 'go'>('a', [
      { from: 'a', event: 'go', to: 'b' },
    ]);
    expect(sm.dispatch('go')).toBe(true);
    expect(sm.getState()).toBe('b');
    expect(sm.dispatch('go')).toBe(false);
  });

  it('EcsLite spawn / component', () => {
    const ecs = new EcsLite();
    const id = ecs.spawn({ hp: 10 });
    expect(ecs.getComponent(id, 'hp')).toBe(10);
    ecs.setComponent(id, 'hp', 9);
    expect(ecs.getComponent(id, 'hp')).toBe(9);
  });

  it('Behavior tree sequence', () => {
    const root = new Sequence<{ ok: boolean }>([
      { tick: () => 'success' },
      {
        tick: (ctx) => (ctx.ok ? 'success' : 'failure'),
      },
    ]);
    expect(root.tick({ ok: true })).toBe('success');
    expect(root.tick({ ok: false })).toBe('failure');
  });
});
