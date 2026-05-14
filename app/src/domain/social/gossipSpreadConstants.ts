/**
 * Ограничения распространения слухов по графу локаций (анти-спам при плотной карте).
 */
/** Максимум новых локаций охвата за один вызов decay/spread на один слух. */
export const CHRONOS_GOSSIP_NEW_LOCATIONS_PER_SPREAD_MAX = 6;
/** Верхняя граница размера множества достигнутых локаций на один активный слух. */
export const CHRONOS_GOSSIP_REACHED_LOCATIONS_CAP = 28;
