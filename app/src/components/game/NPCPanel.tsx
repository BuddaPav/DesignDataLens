// NPC Panel — рамки/статусы из Kimi-ассетов + заглушка портрета из реестра

import * as RadixTooltip from '@radix-ui/react-tooltip';
import { Send, User } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { NPC } from '@/types/game';
import {
  chronosPlaceholderGlyphUrl,
  npcPortraitFrameUrl,
} from '@/domain/assets/chronosGraphicsRegistry';
import {
  NPC_STATUS_I18N_KEY,
  npcHudStatusKind,
  npcStatusIconUrl,
  RELATIONSHIP_I18N_KEY,
  resolveNpcAvatarImgSrc,
} from '@/domain/assets/npcPortraitDisplay';
import { isNpcHostileForQuickCombat } from '@/domain/combat/quickHostileCombat';
import { useLanguage } from '@/i18n/LanguageProvider';
import { t } from '@/i18n';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface NPCPanelProps {
  npcs: NPC[];
  metNPCs: string[];
  onInteract: (npcId: string, type: string, customLine?: string) => void;
}

export function NPCPanel({ npcs, metNPCs, onInteract }: NPCPanelProps) {
  const language = useLanguage();

  const getRelationshipColor = (trust: number, affection: number) => {
    if (affection > 50) return 'text-pink-400';
    if (trust > 50) return 'text-green-400';
    if (trust < -20) return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="space-y-4">
      {npcs.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('game.npc_empty_here', language)}</p>
        </div>
      ) : (
        <RadixTooltip.Provider delayDuration={280}>
          {npcs.map((npc, index) => {
            const rel = npc.playerRelationship;
            const isMet = metNPCs.includes(npc.id);
            const statusKind = npcHudStatusKind(npc);
            const relKey = RELATIONSHIP_I18N_KEY[rel.type];
            const statusTooltip = t(NPC_STATUS_I18N_KEY[statusKind], language);

            return (
              <div
                key={npc.id}
                className="chronos-npc-row-stagger"
                style={{ animationDelay: `${Math.min(index * 45, 450)}ms` }}
              >
                <NpcRow
                  npc={npc}
                  isMet={isMet}
                  relLabel={t(relKey, language)}
                  relColorClass={getRelationshipColor(rel.trust, rel.affection)}
                  statusKind={statusKind}
                  statusTooltip={statusTooltip}
                  onInteract={onInteract}
                  language={language}
                />
              </div>
            );
          })}
        </RadixTooltip.Provider>
      )}
    </div>
  );
}

const NpcRow = memo(function NpcRow({
  npc,
  isMet,
  relLabel,
  relColorClass,
  statusKind,
  statusTooltip,
  onInteract,
  language,
}: {
  npc: NPC;
  isMet: boolean;
  relLabel: string;
  relColorClass: string;
  statusKind: ReturnType<typeof npcHudStatusKind>;
  statusTooltip: string;
  onInteract: NPCPanelProps['onInteract'];
  language: ReturnType<typeof useLanguage>;
}) {
  const initialSrc = resolveNpcAvatarImgSrc(npc);
  const [faceSrc, setFaceSrc] = useState(initialSrc);
  const [replyDraft, setReplyDraft] = useState('');
  const placeholder = chronosPlaceholderGlyphUrl();

  const onPortraitError = useCallback(() => {
    setFaceSrc((s) => (s === placeholder ? s : placeholder));
  }, [placeholder]);

  const sendReply = useCallback(() => {
    const line = replyDraft.trim();
    if (!line) return;
    onInteract(npc.id, 'talk', line);
    setReplyDraft('');
  }, [npc.id, onInteract, replyDraft]);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onInteract(npc.id, 'talk')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onInteract(npc.id, 'talk');
        }
      }}
      className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-violet-500/50 cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
    >
      <div className="flex items-start gap-3">
        <div
          className="relative h-16 w-16 flex-shrink-0 bg-center bg-no-repeat bg-contain"
          style={{ backgroundImage: `url(${npcPortraitFrameUrl()})` }}
        >
          <img
            src={faceSrc}
            alt=""
            width={56}
            height={56}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover z-[1] bg-slate-950 ring-1 ring-white/10"
            onError={onPortraitError}
          />
          <RadixTooltip.Root>
            <RadixTooltip.Trigger asChild>
              <button
                type="button"
                aria-label={statusTooltip}
                className="absolute bottom-0 right-0 z-[2] inline-flex size-[26px] items-center justify-center rounded-md border-0 bg-transparent p-0 shadow-none outline-none focus-visible:ring-2 focus-visible:ring-violet-500/70"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
                }}
              >
                <img
                  src={npcStatusIconUrl(statusKind)}
                  alt=""
                  width={22}
                  height={22}
                  className="pointer-events-none drop-shadow-md"
                  draggable={false}
                />
              </button>
            </RadixTooltip.Trigger>
            <RadixTooltip.Portal>
              <RadixTooltip.Content
                side="top"
                sideOffset={6}
                className={cn(
                  'z-[100] max-w-[240px] rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-xs leading-snug text-slate-100 shadow-xl',
                )}
              >
                {statusTooltip}
                <RadixTooltip.Arrow className="fill-slate-950" />
              </RadixTooltip.Content>
            </RadixTooltip.Portal>
          </RadixTooltip.Root>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-display font-semibold truncate">{npc.name}</h3>
            {!isMet && (
              <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                {t('game.npc_badge_new', language)}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{npc.title}</p>

          <div className="flex items-center gap-4 mt-2 text-xs">
            <span className={relColorClass}>{relLabel}</span>
            {npc.playerRelationship.trust !== 0 && (
              <span className="text-slate-500">
                {language === 'ru' ? 'Доверие' : 'Trust'}:{' '}
                {npc.playerRelationship.trust > 0 ? '+' : ''}
                {npc.playerRelationship.trust}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-600 mt-2 line-clamp-2">{npc.appearance}</p>
          {isNpcHostileForQuickCombat(npc) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full border-red-900/50 text-red-300 hover:bg-red-950/40 hover:text-red-200"
              onClick={(e) => {
                e.stopPropagation();
                onInteract(npc.id, 'combat_attack');
              }}
            >
              {t('game.combat_attack', language)}
            </Button>
          )}
          <div
            className="mt-3 space-y-2 rounded-lg border border-slate-800 bg-slate-950/40 p-2"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {t('dialog.your_line', language)}
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Textarea
                value={replyDraft}
                onChange={(e) => setReplyDraft(e.target.value)}
                placeholder={t('dialog.reply_placeholder', language)}
                rows={2}
                className="min-h-[56px] resize-none border-slate-700 bg-slate-900/80 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:border-violet-500/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={!replyDraft.trim()}
                className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-40"
                onClick={(e) => {
                  e.stopPropagation();
                  sendReply();
                }}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" />
                {t('dialog.send', language)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
