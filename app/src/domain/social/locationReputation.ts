/**
 * Локальная репутация игрока: ключи `location:<locationId>` в `Player.stats.reputation`.
 */

export function locationReputationKey(locationId: string): string {
  const id = locationId.trim();
  if (!id) return 'location:';
  return id.startsWith('location:') ? id : `location:${id}`;
}

/** Значение −100…100 или 0, если ключ отсутствует. */
export function getLocationStanding(reputation: Map<string, number>, locationId: string): number {
  const key = locationReputationKey(locationId);
  const v = reputation.get(key);
  if (typeof v !== 'number' || !Number.isFinite(v)) return 0;
  return Math.max(-100, Math.min(100, v));
}
