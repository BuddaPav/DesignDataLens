// Scene Renderer - Displays narrative and choices

import { useState, useEffect, useRef } from 'react';
import { MapPin, Sparkles, ChevronRight, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { Scene, Location, NPC, Choice } from '@/types/game';
import { getLanguage, t } from '@/i18n';
import { formatAtmosphereLine } from '@/engine/storyLocale';
import { soundManager } from '@/engine/SoundManager';

/** Печать основного текста: ~72 симв/с, синхронизировано с кадрами; ограничение dt при возврате во вкладку. */
const NARRATIVE_CHARS_PER_SEC = 72;
const NARRATIVE_TICK_DT_CAP_SEC = 0.055;

interface SceneRendererProps {
  scene: Scene;
  location: Location;
  npcs: NPC[];
  onChoice: (choice: Choice) => void;
  onNPCInteract: (npcId: string, type: string, customLine?: string) => void;
  /** Когда у сцены нет вариантов выбора — запросить следующую сцену */
  onContinueStory?: () => void;
  /** Режим «мир на весь экран»: компактный текст, реплики — в CSS2D над NPC. */
  immersiveStory?: boolean;
}

export function SceneRenderer({
  scene,
  location,
  npcs,
  onChoice,
  onNPCInteract,
  onContinueStory,
  immersiveStory
}: SceneRendererProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [showChoices, setShowChoices] = useState(false);
  const [replyDraft, setReplyDraft] = useState('');
  const [objectivePeek, setObjectivePeek] = useState(true);
  const lang = getLanguage();
  const skipTypewriterRef = useRef<(() => void) | null>(null);

  const primarySpeakerId = scene.dialogue?.[0]?.speakerId;

  // Typewriter: rAF + скорость по времени; Space/Enter — пропуск; prefers-reduced-motion — сразу полный текст.
  useEffect(() => {
    setDisplayedText('');
    setShowChoices(false);
    setReplyDraft('');

    const text = scene.narrative;
    if (!text.length) {
      setShowChoices(true);
      skipTypewriterRef.current = null;
      return;
    }

    const reduced =
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    if (reduced) {
      setDisplayedText(text);
      const revealTimer = window.setTimeout(() => setShowChoices(true), 80);
      skipTypewriterRef.current = null;
      return () => window.clearTimeout(revealTimer);
    }

    let index = 0;
    let raf = 0;
    let last = performance.now();
    let revealTimer = 0;

    const completeNow = () => {
      cancelAnimationFrame(raf);
      if (revealTimer) window.clearTimeout(revealTimer);
      revealTimer = 0;
      skipTypewriterRef.current = null;
      index = text.length;
      setDisplayedText(text);
      setShowChoices(true);
    };

    skipTypewriterRef.current = () => {
      if (index >= text.length) return;
      completeNow();
    };

    const tick = (now: number) => {
      const dt = Math.min(NARRATIVE_TICK_DT_CAP_SEC, Math.max(0, (now - last) / 1000));
      last = now;
      const step = Math.max(1, Math.floor(NARRATIVE_CHARS_PER_SEC * dt));
      index = Math.min(text.length, index + step);
      setDisplayedText(text.slice(0, index));

      if (index < text.length) {
        raf = requestAnimationFrame(tick);
      } else {
        skipTypewriterRef.current = null;
        revealTimer = window.setTimeout(() => setShowChoices(true), 220);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      if (revealTimer) window.clearTimeout(revealTimer);
      skipTypewriterRef.current = null;
    };
  }, [scene.narrative, scene.id]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showChoices) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest('textarea, input, select, [contenteditable="true"]')) return;
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (!skipTypewriterRef.current) return;
      e.preventDefault();
      skipTypewriterRef.current();
      soundManager.play('click');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showChoices]);

  useEffect(() => {
    if (!immersiveStory) return;
    setObjectivePeek(true);
    const t = window.setTimeout(() => setObjectivePeek(false), 5200);
    return () => window.clearTimeout(t);
  }, [scene.narrative, scene.id, immersiveStory]);

  const sendReply = () => {
    const line = replyDraft.trim();
    if (!line || !primarySpeakerId) return;
    onNPCInteract(primarySpeakerId, 'talk', line);
    setReplyDraft('');
    soundManager.play('click');
  };

  const panelClass = immersiveStory
    ? 'relative space-y-4 rounded-2xl border border-cyan-400/15 bg-black/40 p-4 sm:p-5 backdrop-blur-xl ring-1 ring-white/[0.04] shadow-[0_-12px_40px_rgba(0,0,0,0.35)]'
    : 'chronos-panel space-y-6 p-5 sm:p-7 md:p-8 ring-1 ring-white/[0.04]';

  const objectiveSnippet =
    scene.narrative.length > 140 ? `${scene.narrative.slice(0, 137)}…` : scene.narrative;

  const narrativeTyping =
    Boolean(scene.narrative.length) && !showChoices;

  return (
    <article className={panelClass} data-testid="chronos-scene-panel" aria-busy={narrativeTyping}>
      {immersiveStory && (
        <div
          className={`pointer-events-none absolute right-3 top-3 z-[1] max-w-[min(280px,40vw)] text-right text-[11px] leading-snug text-slate-200/90 transition-opacity duration-700 ${
            objectivePeek ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="block text-[9px] font-semibold uppercase tracking-widest text-cyan-300/85">
            {t('scene.story_now', lang)}
          </span>
          <span className="mt-1 block font-display">{objectiveSnippet}</span>
        </div>
      )}
      {/* Location header */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[var(--chronos-text-secondary)] animate-fade-in font-sans">
        <MapPin className="w-4 h-4 shrink-0 text-[var(--chronos-primary-hex)] drop-shadow-[0_0_6px_rgba(102,252,241,0.35)]" />
        <span className="font-display font-semibold tracking-tight text-[var(--chronos-text)]">{location.name}</span>
        {scene.atmosphere && (
          <>
            <span>•</span>
            <span className="capitalize">{scene.atmosphere.mood}</span>
          </>
        )}
      </div>

      {/* Atmosphere description */}
      {scene.atmosphere && (
        <div
          className={
            immersiveStory
              ? 'text-xs leading-relaxed text-[var(--chronos-text-secondary)] italic border-l-[2px] border-[var(--chronos-primary-hex)]/35 pl-3 rounded-r-lg bg-black/25 py-2 pr-3'
              : 'text-sm leading-relaxed text-[var(--chronos-text-secondary)] italic border-l-[3px] border-[var(--chronos-primary-hex)]/40 pl-4 animate-fade-in rounded-r-xl bg-black/20 py-3 pr-4'
          }
        >
          {formatAtmosphereLine(scene.atmosphere, lang)}
        </div>
      )}

      {/* Main narrative */}
      <div className="prose prose-invert prose-lg max-w-none prose-p:leading-[1.75]">
        {narrativeTyping && (
          <span className="sr-only">{t('scene.skip_to_choices_hint', lang)}</span>
        )}
        <p className="font-display text-[1.05rem] sm:text-lg leading-[1.75] text-[var(--chronos-text)] tracking-[0.01em]">
          {displayedText}
          {!showChoices && (
            <span
              className="inline-block w-[2px] h-[1.05em] ml-0.5 rounded-sm bg-[var(--chronos-primary-hex)] shadow-[0_0_10px_rgba(102,252,241,0.5)] animate-pulse align-middle"
              style={{ verticalAlign: '-0.12em' }}
            />
          )}
        </p>
      </div>

      {/* Dialogue — в immersive-режиме реплики показываются в мире (CSS2D над NPC). */}
      {scene.dialogue && scene.dialogue.length > 0 && !immersiveStory && (
        <div className="space-y-4">
          {scene.dialogue.map((dialogue, index) => (
            <div
              key={dialogue.id}
              className="flex gap-4 animate-fade-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-900/40 ring-2 ring-white/10">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300/90 mb-1.5">
                  {dialogue.speakerName}
                </p>
                <p className="text-[var(--chronos-text)]/95 bg-black/25 rounded-xl px-4 py-3 border border-white/[0.06] shadow-inner leading-relaxed">
                  &quot;{dialogue.text}&quot;
                </p>
              </div>
            </div>
          ))}
          {showChoices && primarySpeakerId && (
            <div className="space-y-2 pl-4 sm:pl-14 border-l-2 border-[var(--chronos-primary-hex)]/20">
              <p className="text-xs font-medium text-[var(--chronos-text-secondary)]">{t('dialog.your_line', lang)}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  placeholder={t('dialog.reply_placeholder', lang)}
                  rows={2}
                  className="min-h-[76px] bg-black/30 border-white/10 text-[var(--chronos-text)] placeholder:text-[var(--chronos-text-disabled)] focus-visible:border-[var(--chronos-primary-hex)]/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendReply();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={sendReply}
                  disabled={!replyDraft.trim()}
                  className="shrink-0 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-900/30 disabled:opacity-40"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {t('dialog.send', lang)}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {immersiveStory && scene.dialogue && scene.dialogue.length > 0 && showChoices && primarySpeakerId && (
        <div className="space-y-2 rounded-xl border border-cyan-500/15 bg-black/30 px-3 py-2">
          <p className="text-[10px] font-medium uppercase tracking-wider text-cyan-200/80">
            {t('dialog.your_line', lang)}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Textarea
              value={replyDraft}
              onChange={(e) => setReplyDraft(e.target.value)}
              placeholder={t('dialog.reply_placeholder', lang)}
              rows={2}
              className="min-h-[64px] bg-black/35 border-white/10 text-[var(--chronos-text)] placeholder:text-[var(--chronos-text-disabled)] focus-visible:border-[var(--chronos-primary-hex)]/50"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendReply();
                }
              }}
            />
            <Button
              type="button"
              onClick={sendReply}
              disabled={!replyDraft.trim()}
              className="shrink-0 h-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-md shadow-violet-900/30 disabled:opacity-40"
            >
              <Send className="w-4 h-4 mr-2" />
              {t('dialog.send', lang)}
            </Button>
          </div>
        </div>
      )}

      {/* NPCs in location */}
      {npcs.length > 0 && !immersiveStory && (
        <div className="border-t border-white/[0.06] pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--chronos-text-secondary)] mb-3">
            {t('scene.people_nearby', lang)}
          </p>
          <div className="flex flex-wrap gap-2">
            {npcs.map((npc) => (
              <button
                key={npc.id}
                type="button"
                onClick={() => onNPCInteract(npc.id, 'talk')}
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all duration-200 bg-black/25 border border-white/[0.06] hover:border-[var(--chronos-primary-hex)]/35 hover:bg-[var(--chronos-surface)]/50 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center ring-1 ring-white/15">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-[var(--chronos-text)]">{npc.name}</span>
                <span className="text-xs text-[var(--chronos-text-secondary)] max-w-[10rem] truncate">{npc.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Choices */}
      {showChoices && scene.choices.length > 0 && (
        <div className="space-y-4 pt-5 border-t border-white/[0.06] animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--chronos-text-secondary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--chronos-primary-hex)]" />
            {t('scene.what_do_you_do', lang)}
          </p>

          <div className="space-y-2.5">
            {scene.choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => onChoice(choice)}
                className="w-full text-left p-4 sm:p-4 rounded-xl bg-black/20 hover:bg-[var(--chronos-surface)]/60 border border-white/[0.07] hover:border-[var(--chronos-primary-hex)]/30 transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:bg-[var(--chronos-primary-hex)]/15 transition-colors ring-1 ring-white/5">
                    <ChevronRight className="w-4 h-4 text-violet-300 group-hover:text-[var(--chronos-primary-hex)] transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--chronos-text)] group-hover:text-white transition-colors leading-snug">
                      {choice.text}
                    </p>
                    {choice.type === 'moral' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/95 mt-2 inline-block px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                        {t('scene.choice_moral', lang)}
                      </span>
                    )}
                    {choice.type === 'strategic' && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/95 mt-2 inline-block px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20">
                        {t('scene.choice_strategic', lang)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {showChoices && scene.choices.length === 0 && (
        <div className="pt-5 border-t border-white/[0.06]">
          <Button
            type="button"
            className="w-full h-12 text-base font-semibold tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-900/35 border border-white/10"
            onClick={() => {
              soundManager.play('click');
              onContinueStory?.();
            }}
          >
            {t('scene.continue_story', lang)}
            <ChevronRight className="w-4 h-4 ml-2 opacity-90" />
          </Button>
        </div>
      )}
    </article>
  );
}
