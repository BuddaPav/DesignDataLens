/**
 * Классификация записей журнала мира — одна точка для фильтров UI (панель «Мир»).
 */
import type { WorldLogEntry } from '@/types/game';

/** Наследие записей без поля topic: ключевые слова RU/EN для «социального» слоя. */
const LEGACY_SOCIAL_MESSAGE_HINT =
  /репутац|reputation|довер|trust|слух|rumor|фракц|faction|коалиц|coalition|отношен|relationship|настроен|disposition|sympathy|уважен|respect|сплетн|gossip|мерчант|thieves|guild|церков|church|академ/i;

export function isWorldLogEntrySocial(e: WorldLogEntry): boolean {
  if (e.topic === 'social') return true;
  const sev = e.severity ?? 'info';
  if (sev === 'rumor' || sev === 'dramatic') return true;
  return LEGACY_SOCIAL_MESSAGE_HINT.test(e.message);
}
