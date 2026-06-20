export type NpcModelRuntime = 'local-webllm' | 'cloud-api' | 'procedural';

export type NpcModelProfile = {
  id: 'performance' | 'balanced' | 'cinematic';
  label: string;
  runtime: NpcModelRuntime;
  localModel: string | null;
  cloudModelHint: string | null;
  notes: string;
};

export const NPC_MODEL_PROFILES: readonly NpcModelProfile[] = [
  {
    id: 'performance',
    label: 'Performance',
    runtime: 'local-webllm',
    localModel: 'Qwen2.5-7B-Instruct-q4f16_1-MLC',
    cloudModelHint: null,
    notes: 'Fast response and lower VRAM pressure for broad NPC coverage.',
  },
  {
    id: 'balanced',
    label: 'Balanced',
    runtime: 'local-webllm',
    localModel: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
    cloudModelHint: 'Mistral-class Instruct fallback',
    notes: 'Default gameplay profile with good memory/personality retention.',
  },
  {
    id: 'cinematic',
    label: 'Cinematic',
    runtime: 'cloud-api',
    localModel: 'Llama-3.1-8B-Instruct-q4f32_1-MLC',
    cloudModelHint: 'Frontier reasoning model for key scenes',
    notes: 'Use cloud for hero NPC arcs, local fallback when offline.',
  },
] as const;

export const DEFAULT_LOCAL_WEBLLM_MODEL =
  NPC_MODEL_PROFILES.find((p) => p.id === 'balanced')?.localModel ??
  'Llama-3.1-8B-Instruct-q4f32_1-MLC';
