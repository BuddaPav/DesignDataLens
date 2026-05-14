import { decayAndSpreadRumors, type RumorSpreadDTO } from '@/engine/gossipSpreadPure';

type RumorSpreadWorkRequest = {
  rumors: RumorSpreadDTO[];
  hours: number;
  adjacency: Record<string, string[]>;
  token: number;
};

type RumorSpreadWorkResponse = {
  rumors: RumorSpreadDTO[];
  token: number;
};

self.onmessage = (e: MessageEvent<RumorSpreadWorkRequest>) => {
  const { rumors, hours, adjacency, token } = e.data;
  const out = decayAndSpreadRumors(rumors, hours, adjacency);
  const msg: RumorSpreadWorkResponse = { rumors: out, token };
  self.postMessage(msg);
};

