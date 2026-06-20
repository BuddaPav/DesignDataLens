import { useEffect, useMemo, useState } from 'react';
import { Globe2, Swords, X } from 'lucide-react';
import type {
  ActiveRumor,
  DelayedConsequencePending,
  EnemyCoalition,
  NPC,
  PlayerObligationPending,
  WorldLogEntry,
} from '@/types/game';
import {
  CHRONOS_CORE_FACTION_IDS,
  FACTION_REPUTATION_MAX,
  FACTION_REPUTATION_MIN,
} from '@/domain/social/factionReputationRules';
import { delayedConsequenceStats } from '@/domain/consequences/delayedConsequenceQueue';
import { isWorldLogEntrySocial } from '@/domain/social/worldLogTopicRules';
import { collectFactionTagsFromRumors, filterRumorsForView } from '@/domain/social/rumorViewRules';
import type { Language } from '@/i18n/index';
import { t } from '@/i18n/index';

type WorldStatusPanelProps = {
  factionReputation: Record<string, number> | undefined;
  activeRumors: ActiveRumor[] | undefined;
  enemyCoalitions: EnemyCoalition[] | undefined;
  worldEventLog: WorldLogEntry[] | undefined;
  delayedConsequences?: DelayedConsequencePending[];
  playerObligations?: PlayerObligationPending[];
  npcs: NPC[];
  playerLocationId?: string;
  lang: Language;
  /** Увеличивается при открытии панели из HUD коалиций — вкладка «Коалиции». */
  coalitionFocusTrigger?: number;
  /** Сбросить счётчик после переключения вкладки. */
  onCoalitionFocusConsumed?: () => void;
};

function npcNameById(npcs: NPC[], id: string): string {
  return npcs.find((n) => n.id === id)?.name ?? id;
}

function FactionRepBar({ factionId, value, lang }: { factionId: string; value: number; lang: Language }) {
  const label = t(`game.faction.${factionId}` as Parameters<typeof t>[0], lang);
  const clamped = Math.max(FACTION_REPUTATION_MIN, Math.min(FACTION_REPUTATION_MAX, value));
  const pct = ((clamped - FACTION_REPUTATION_MIN) / (FACTION_REPUTATION_MAX - FACTION_REPUTATION_MIN)) * 100;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-mono text-slate-300">{clamped}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-600/90 via-slate-500 to-emerald-500/90 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function WorldStatusPanel({
  factionReputation,
  activeRumors,
  enemyCoalitions,
  worldEventLog,
  delayedConsequences,
  playerObligations,
  npcs,
  playerLocationId,
  lang,
  coalitionFocusTrigger = 0,
  onCoalitionFocusConsumed,
}: WorldStatusPanelProps) {
  const STORAGE_KEY = 'chronos_world_panel';
  const rep = factionReputation ?? {};
  const coalitions = useMemo(() => enemyCoalitions ?? [], [enemyCoalitions]);
  const log = useMemo(() => worldEventLog ?? [], [worldEventLog]);
  const [tab, setTab] = useState<'rep' | 'rumors' | 'log' | 'coalitions'>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const j = raw ? (JSON.parse(raw) as { tab?: string }).tab : undefined;
      return j === 'rumors' || j === 'log' || j === 'coalitions' ? j : 'rep';
    } catch {
      return 'rep';
    }
  });
  const [onlyHere, setOnlyHere] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const j = raw ? (JSON.parse(raw) as { onlyHere?: boolean }).onlyHere : undefined;
      return j !== false;
    } catch {
      return true;
    }
  });
  const [tag, setTag] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const j = raw ? (JSON.parse(raw) as { tag?: string }).tag : '';
      return typeof j === 'string' ? j : '';
    } catch {
      return '';
    }
  });
  const [logSeverity, setLogSeverity] = useState<'all' | 'info' | 'rumor' | 'dramatic' | 'social'>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const j = raw ? (JSON.parse(raw) as { logSeverity?: string }).logSeverity : undefined;
      return j === 'info' || j === 'rumor' || j === 'dramatic' || j === 'social' ? j : 'all';
    } catch {
      return 'all';
    }
  });
  const [logQuery, setLogQuery] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const j = raw ? (JSON.parse(raw) as { logQuery?: string }).logQuery : '';
      return typeof j === 'string' ? j : '';
    } catch {
      return '';
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tab, onlyHere, tag, logSeverity, logQuery }));
    } catch {
      /* ignore */
    }
  }, [tab, onlyHere, tag, logSeverity, logQuery]);

  useEffect(() => {
    if (!coalitionFocusTrigger) return;
    setTab('coalitions');
    onCoalitionFocusConsumed?.();
  }, [coalitionFocusTrigger, onCoalitionFocusConsumed]);

  const availableTags = useMemo(() => collectFactionTagsFromRumors(activeRumors ?? []), [activeRumors]);
  const tagLabel = (tkey: string): string => {
    // Known core factions have localized labels.
    if (CHRONOS_CORE_FACTION_IDS.includes(tkey as (typeof CHRONOS_CORE_FACTION_IDS)[number])) {
      return t(`game.faction.${tkey}` as Parameters<typeof t>[0], lang);
    }
    return tkey;
  };
  const rumorsSorted = useMemo(() => {
    const list = activeRumors ?? [];
    const filtered = filterRumorsForView(list, {
      onlyReachedLocationId: onlyHere ? playerLocationId : undefined,
      factionTag: tag || undefined,
      hideExpired: true,
    });
    return [...filtered].sort((a, b) => b.ttlHours - a.ttlHours);
  }, [activeRumors, onlyHere, playerLocationId, tag]);

  const logFiltered = useMemo(() => {
    const q = logQuery.trim().toLowerCase();
    return log
      .filter((e) => {
        if (logSeverity === 'all') return true;
        if (logSeverity === 'social') return isWorldLogEntrySocial(e);
        return (e.severity ?? 'info') === logSeverity;
      })
      .filter((e) => (q ? e.message.toLowerCase().includes(q) : true))
      .slice(-64)
      .reverse();
  }, [log, logQuery, logSeverity]);

  const coalitionsSorted = useMemo(() => {
    return [...coalitions].sort((a, b) => b.memberNpcIds.length - a.memberNpcIds.length);
  }, [coalitions]);
  const delayedStats = useMemo(
    () => delayedConsequenceStats(delayedConsequences),
    [delayedConsequences],
  );
  const obligationStats = useMemo(() => {
    const list = playerObligations ?? [];
    if (list.length === 0) return { count: 0, minHours: 0 };
    let minHours = Number.POSITIVE_INFINITY;
    for (const o of list) minHours = Math.min(minHours, o.remainingHours);
    return { count: list.length, minHours };
  }, [playerObligations]);

  return (
    <div className="space-y-6">
      {(delayedStats.count > 0 || obligationStats.count > 0) && (
        <div className="space-y-2">
          {delayedStats.count > 0 && (
            <div className="rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
              {lang === 'ru'
                ? `Ожидаемые последствия: ${delayedStats.count} · ближайшее через ${delayedStats.minHours} ч., окно до ${delayedStats.maxHours} ч.`
                : `Incoming consequences: ${delayedStats.count} · first in ${delayedStats.minHours}h, window up to ${delayedStats.maxHours}h.`}
            </div>
          )}
          {obligationStats.count > 0 && (
            <div className="rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100">
              {lang === 'ru'
                ? `Обязательства мира: ${obligationStats.count} · ближайшее через ${obligationStats.minHours} ч.`
                : `World obligations: ${obligationStats.count} · nearest in ${obligationStats.minHours}h.`}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          className={
            tab === 'rep'
              ? 'px-3 py-1 rounded-md bg-white/[0.08] text-slate-200'
              : 'px-3 py-1 rounded-md hover:bg-white/[0.04] text-slate-400'
          }
          onClick={() => setTab('rep')}
        >
          {t('game.world_tab_rep', lang)}
        </button>
        <button
          className={
            tab === 'rumors'
              ? 'px-3 py-1 rounded-md bg-white/[0.08] text-slate-200'
              : 'px-3 py-1 rounded-md hover:bg-white/[0.04] text-slate-400'
          }
          onClick={() => setTab('rumors')}
        >
          {t('game.world_tab_rumors', lang)}
        </button>
        <button
          className={
            tab === 'log'
              ? 'px-3 py-1 rounded-md bg-white/[0.08] text-slate-200'
              : 'px-3 py-1 rounded-md hover:bg-white/[0.04] text-slate-400'
          }
          onClick={() => setTab('log')}
        >
          {t('game.world_tab_log', lang)}
        </button>
        <button
          className={
            tab === 'coalitions'
              ? 'px-3 py-1 rounded-md bg-white/[0.08] text-slate-200'
              : 'px-3 py-1 rounded-md hover:bg-white/[0.04] text-slate-400'
          }
          onClick={() => setTab('coalitions')}
        >
          {t('game.world_tab_coalitions', lang)}
        </button>
      </div>

      {tab === 'rep' && (
        <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <Globe2 className="h-4 w-4 text-[var(--chronos-primary-hex)]" />
          {t('game.world_rep_heading', lang)}
        </h3>
        <div className="space-y-3">
          {CHRONOS_CORE_FACTION_IDS.map((id) => (
            <FactionRepBar key={id} factionId={id} value={rep[id] ?? 0} lang={lang} />
          ))}
        </div>
        </div>
      )}

      {tab === 'rumors' && (
        <div>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          {t('game.world_rumors_heading', lang)}
        </h3>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            className={
              onlyHere
                ? 'px-2 py-1 rounded bg-white/[0.08] text-slate-200 text-xs'
                : 'px-2 py-1 rounded hover:bg-white/[0.04] text-slate-400 text-xs'
            }
            onClick={() => setOnlyHere((v) => !v)}
            title={t('game.world_filter_only_here_desc', lang)}
          >
            {t('game.world_filter_only_here', lang)}
          </button>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder={t('game.world_filter_tag_placeholder', lang)}
            className="h-8 px-2 rounded bg-slate-950/40 border border-white/[0.06] text-slate-200 text-xs outline-none"
          />
          <button
            className="px-2 py-1 rounded hover:bg-white/[0.04] text-slate-400 text-xs flex items-center gap-1"
            onClick={() => {
              setOnlyHere(true);
              setTag('');
            }}
            title={t('game.world_filter_clear_desc', lang)}
          >
            <X className="w-3 h-3" />
            {t('game.world_filter_clear', lang)}
          </button>
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {availableTags.map((tkey) => (
                <button
                  key={tkey}
                  className={
                    tag.trim() === tkey
                      ? 'px-2 py-1 rounded bg-amber-500/20 text-amber-200 text-[10px] uppercase tracking-wide'
                      : 'px-2 py-1 rounded hover:bg-white/[0.04] text-slate-400 text-[10px] uppercase tracking-wide'
                  }
                  onClick={() => setTag(tag.trim() === tkey ? '' : tkey)}
                  title={t('game.world_filter_tag_pick', lang)}
                >
                  {tagLabel(tkey)}
                </button>
              ))}
            </div>
          )}
        </div>
        {rumorsSorted.length === 0 ? (
          <p className="text-sm text-slate-500">{t('game.world_no_rumors', lang)}</p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1 text-sm">
            {rumorsSorted.map((r) => (
              <li
                key={r.id}
                className="rounded-lg border border-white/[0.06] bg-slate-900/40 p-2 text-slate-300"
              >
                <p className="leading-snug text-slate-200">{r.message}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-slate-500">
                  <span>
                    {Math.max(0, Math.ceil(r.ttlHours))} {t('game.world_rumor_ttl_suffix', lang)}
                  </span>
                  {r.factionTags.length > 0 && (
                    <span className="text-amber-200/80">{r.factionTags.join(' · ')}</span>
                  )}
                  <button
                    type="button"
                    className="ml-auto rounded border border-white/[0.08] px-2 py-0.5 text-[9px] normal-case tracking-normal text-slate-400 hover:bg-white/[0.06] hover:text-slate-200"
                    onClick={() => {
                      const q = r.message.replace(/\s+/g, ' ').trim().slice(0, 56);
                      setLogQuery(q);
                      setTab('log');
                    }}
                  >
                    {t('game.world_rumor_find_log', lang)}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      )}

      {tab === 'log' && (
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
            {t('game.world_log_heading', lang)}
          </h3>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1">
              {(['all', 'info', 'rumor', 'dramatic', 'social'] as const).map((s) => (
                <button
                  key={s}
                  className={
                    logSeverity === s
                      ? 'px-2 py-1 rounded bg-white/[0.08] text-slate-200 text-xs'
                      : 'px-2 py-1 rounded hover:bg-white/[0.04] text-slate-400 text-xs'
                  }
                  onClick={() => setLogSeverity(s)}
                >
                  {t(
                    (`game.world_log_filter_${s}` as unknown) as Parameters<typeof t>[0],
                    lang,
                  )}
                </button>
              ))}
            </div>
            <input
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
              placeholder={t('game.world_log_search_placeholder', lang)}
              className="h-8 px-2 rounded bg-slate-950/40 border border-white/[0.06] text-slate-200 text-xs outline-none"
            />
          </div>
          {log.length === 0 ? (
            <p className="text-sm text-slate-500">{t('game.world_log_empty', lang)}</p>
          ) : (
            <ul className="max-h-56 space-y-2 overflow-y-auto pr-1 text-sm">
              {logFiltered.map((e) => (
                <li
                  key={e.id}
                  className="rounded-lg border border-white/[0.06] bg-black/25 p-2 text-slate-300"
                >
                  <span className="text-slate-500 text-xs mr-2">
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </span>
                  <span
                    className={
                      e.severity === 'dramatic'
                        ? 'text-amber-200'
                        : e.severity === 'rumor'
                          ? 'text-slate-200'
                          : 'text-slate-300'
                    }
                  >
                    {e.message}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'coalitions' && (
        <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
          <Swords className="h-4 w-4 text-rose-400/90" />
          {t('game.world_coalitions_heading', lang)}
        </h3>
        {coalitions.length === 0 ? (
          <p className="text-sm text-slate-500">{t('game.world_no_coalitions', lang)}</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {coalitionsSorted.map((c) => (
              <li
                key={c.id}
                className="rounded-lg border border-rose-500/20 bg-rose-950/20 p-2 text-slate-300"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-rose-200/90">{npcNameById(npcs, c.leaderNpcId)}</span>
                    <span className="text-slate-500"> · </span>
                    <span className="text-xs text-slate-400">
                      {c.memberNpcIds.length} {t('game.world_coalition_members', lang)}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {new Date(c.formedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {c.memberNpcIds
                    .slice(0, 4)
                    .map((id) => npcNameById(npcs, id))
                    .join(', ')}
                  {c.memberNpcIds.length > 4 ? '…' : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
        </div>
      )}
    </div>
  );
}
