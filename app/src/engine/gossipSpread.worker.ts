import { decayAndSpreadRumors, type RumorSpreadDTO } from '@/engine/gossipSpreadPure';
import { createDeterministicRng } from '@/domain/sim/deterministicRng';

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

self.onmessage = (e: MessageEvent<RumorSpreadWorkRequest>) => {
  const { rumors, hours, adjacency, token, seed } = e.data;
  const out = decayAndSpreadRumors(rumors, hours, adjacency, createDeterministicRng(seed));
  const msg: RumorSpreadWorkResponse = { rumors: out, token };
  self.postMessage(msg);
};

