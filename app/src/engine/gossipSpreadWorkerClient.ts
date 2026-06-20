import { activeRumorToDto, dtoToActiveRumor, type RumorSpreadDTO } from '@/engine/gossipSpreadPure';
import type { ActiveRumor } from '@/types/game';

type RumorSpreadWorkRequest = {
  rumors: RumorSpreadDTO[];
  hours: number;
  adjacency: Record<string, string[]>;
  token: number;
  seed: number;
};

type RumorSpreadWorkResponse = {
  rumors: RumorSpreadDTO[];
  token: number;
};

let workerSingleton: Worker | null = null;

function getRumorWorker(): Worker | null {
  try {
    if (typeof Worker === 'undefined') return null;
    if (workerSingleton) return workerSingleton;
    workerSingleton = new Worker(new URL('./gossipSpread.worker.ts', import.meta.url), { type: 'module' });
    return workerSingleton;
  } catch {
    return null;
  }
}

export async function decayAndSpreadRumorsInWorker(
  rumors: ActiveRumor[],
  hours: number,
  adjacency: Record<string, string[]>,
  token: number,
  seed: number,
): Promise<{ rumors: ActiveRumor[]; token: number } | null> {
  const w = getRumorWorker();
  if (!w) return null;

  const payload: RumorSpreadWorkRequest = {
    rumors: rumors.map(activeRumorToDto),
    hours,
    adjacency,
    token,
    seed,
  };

  return await new Promise((resolve) => {
    const onMessage = (e: MessageEvent<RumorSpreadWorkResponse>) => {
      const data = e.data;
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      if (!data || data.token !== token) {
        resolve(null);
        return;
      }
      resolve({
        rumors: data.rumors.map(dtoToActiveRumor),
        token: data.token,
      });
    };
    const onError = () => {
      w.removeEventListener('message', onMessage);
      w.removeEventListener('error', onError);
      resolve(null);
    };
    w.addEventListener('message', onMessage);
    w.addEventListener('error', onError);
    w.postMessage(payload);
  });
}

