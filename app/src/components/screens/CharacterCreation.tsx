// Character Creation Screen

import { useState } from 'react';
import { Sword, Brain, Heart, Eye, Sparkles, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import type { Player, Character, WorldEra } from '@/types/game';
import { useLanguage } from '@/i18n/LanguageProvider';
import { t } from '@/i18n';
import {
  applyGraphicsProfile,
  detectGraphicsProfile,
  loadChronosGameSettings,
  saveChronosGameSettings,
  type ChronosGraphicsProfile,
} from '@/lib/chronosGameSettings';

interface CharacterCreationProps {
  onComplete: (character: Partial<Character>) => void;
  player: Player | null;
}

type CreationStep = 'origin' | 'era' | 'attributes' | 'personality' | 'tone' | 'confirm';

type OriginId = 'village' | 'city' | 'wilderness' | 'noble' | 'mystery';

const originsBase: Array<{
  id: OriginId;
  bonus: Partial<Record<'strength' | 'intelligence' | 'charisma' | 'agility' | 'wisdom' | 'luck', number>>;
  icon: string;
}> = [
  { id: 'village', bonus: { strength: 1, wisdom: 1 }, icon: '🏘️' },
  { id: 'city', bonus: { intelligence: 1, charisma: 1 }, icon: '🏙️' },
  { id: 'wilderness', bonus: { agility: 1, wisdom: 1 }, icon: '🌲' },
  { id: 'noble', bonus: { charisma: 1, intelligence: 1 }, icon: '👑' },
  { id: 'mystery', bonus: { luck: 2 }, icon: '❓' }
];

const originsText = {
  ru: {
    village: { name: 'Деревенский', description: 'Вы выросли в тихой деревне и знаете цену труду и общине.' },
    city: { name: 'Горожанин', description: 'Улицы большого города стали вашей школой: вы умеете читать людей и ситуации.' },
    wilderness: { name: 'Выживший в дикой природе', description: 'Дикие земли закалили вас. Вы доверяете инстинктам больше всего.' },
    noble: { name: 'Падший дворянин', description: 'Когда-то вы были привилегированны, теперь — закалены. Ваша гордость стала ношей.' },
    mystery: { name: 'Неизвестное прошлое', description: 'Память — осколки. Важно не то, кем вы были, а кем станете.' }
  },
  en: {
    village: { name: 'Village Born', description: 'Raised in a quiet village, you know the value of community and hard work.' },
    city: { name: 'City Dweller', description: 'The streets of a great city were your classroom. You learned to read people and situations.' },
    wilderness: { name: 'Wilderness Survivor', description: 'The untamed wilds forged you. You trust your instincts above all.' },
    noble: { name: 'Fallen Noble', description: 'Once privileged, now humbled. You carry the weight of lost glory.' },
    mystery: { name: 'Unknown Past', description: 'Your memories are fragments. Who you were is less important than who you become.' }
  }
} as const;

const storyTonesBase = [
  { id: 'heroic', color: 'from-amber-500 to-orange-600' },
  { id: 'mysterious', color: 'from-violet-500 to-purple-600' },
  { id: 'dark', color: 'from-slate-600 to-slate-800' },
  { id: 'whimsical', color: 'from-pink-500 to-rose-600' }
] as const;

const storyTonesText = {
  ru: {
    heroic: { name: 'Героическая', description: 'Эпические истории о смелости и жертве' },
    mysterious: { name: 'Загадочная', description: 'Тайны, заговоры и скрытые истины' },
    dark: { name: 'Мрачная', description: 'Моральная неоднозначность и трудные решения' },
    whimsical: { name: 'Причудливая', description: 'Чудеса, магия и неожиданная радость' }
  },
  en: {
    heroic: { name: 'Heroic', description: 'Epic tales of courage and sacrifice' },
    mysterious: { name: 'Mysterious', description: 'Secrets, conspiracies, and hidden truths' },
    dark: { name: 'Dark', description: 'Moral ambiguity and difficult choices' },
    whimsical: { name: 'Whimsical', description: 'Magic, wonder, and unexpected joy' }
  }
} as const;

const attrLabel = {
  ru: {
    strength: 'Сила',
    intelligence: 'Интеллект',
    charisma: 'Харизма',
    agility: 'Ловкость',
    wisdom: 'Мудрость',
    luck: 'Удача'
  },
  en: {
    strength: 'Strength',
    intelligence: 'Intelligence',
    charisma: 'Charisma',
    agility: 'Agility',
    wisdom: 'Wisdom',
    luck: 'Luck'
  }
} as const;

export function CharacterCreation({ onComplete, player }: CharacterCreationProps) {
  const language = useLanguage();
  const [step, setStep] = useState<CreationStep>('origin');
  const [character, setCharacter] = useState<Partial<Character>>({
    origin: 'village',
    worldEra: 'medieval',
    attributes: {
      strength: 10,
      intelligence: 10,
      charisma: 10,
      agility: 10,
      wisdom: 10,
      luck: 10
    },
    personality: {
      brave: 50,
      cunning: 50,
      kind: 50,
      ruthless: 50,
      honorable: 50,
      mysterious: 50
    }
  });
  const [selectedTone, setSelectedTone] = useState('heroic');
  const [graphicsProfile, setGraphicsProfile] = useState<ChronosGraphicsProfile>(() =>
    detectGraphicsProfile(loadChronosGameSettings())
  );

  const updateAttribute = (attr: string, value: number) => {
    setCharacter(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes!,
        [attr]: value
      }
    }));
  };

  const updatePersonality = (trait: string, value: number) => {
    setCharacter(prev => ({
      ...prev,
      personality: {
        ...prev.personality!,
        [trait]: value
      }
    }));
  };

  const handleComplete = () => {
    const nextSettings = applyGraphicsProfile(loadChronosGameSettings(), graphicsProfile);
    saveChronosGameSettings(nextSettings);
    window.dispatchEvent(new Event('chronos:settings_updated'));
    onComplete({
      ...character,
      backstory: `A ${character.origin?.replace('_', ' ')} who seeks their destiny.`
    });
  };

  const renderStep = () => {
    switch (step) {
      case 'origin':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t('cc.choose_origin', language)}</h2>
              <p className="text-slate-400">{t('cc.origin_sub', language)}</p>
            </div>

            <div className="grid gap-4">
              {originsBase.map((origin) => {
                const txt = originsText[language][origin.id];
                return (
                  <button
                    key={origin.id}
                    onClick={() => setCharacter(prev => ({ ...prev, origin: origin.id }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      character.origin === origin.id
                        ? 'border-[var(--chronos-primary-hex)]/55 bg-[var(--chronos-primary-hex)]/10 shadow-[0_0_28px_rgba(102,252,241,0.14)] ring-1 ring-[var(--chronos-primary-hex)]/25'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{origin.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{txt.name}</h3>
                        <p className="text-sm text-slate-400">{txt.description}</p>
                        <div className="flex gap-2 mt-2">
                          {Object.entries(origin.bonus).map(([attr, val]) => (
                            <span key={attr} className="text-xs bg-slate-800 px-2 py-1 rounded">
                              +{val} {(attrLabel[language] as Record<string, string>)[attr] ?? attr}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'era': {
        const eras: { id: WorldEra; title: string; desc: string }[] = [
          { id: 'medieval', title: t('cc.era_medieval', language), desc: t('cc.era_medieval_desc', language) },
          { id: 'modern', title: t('cc.era_modern', language), desc: t('cc.era_modern_desc', language) },
          { id: 'future', title: t('cc.era_future', language), desc: t('cc.era_future_desc', language) }
        ];
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t('cc.choose_era', language)}</h2>
              <p className="text-slate-400">{t('cc.era_sub', language)}</p>
            </div>
            <div className="grid gap-4">
              {eras.map((era) => (
                <button
                  key={era.id}
                  type="button"
                  onClick={() => setCharacter((prev) => ({ ...prev, worldEra: era.id }))}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    character.worldEra === era.id
                      ? 'border-[var(--chronos-primary-hex)]/55 bg-[var(--chronos-primary-hex)]/10 shadow-[0_0_28px_rgba(102,252,241,0.14)] ring-1 ring-[var(--chronos-primary-hex)]/25'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <h3 className="font-semibold text-lg">{era.title}</h3>
                  <p className="text-sm text-slate-400 mt-1">{era.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      }

      case 'attributes':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t('cc.attributes', language)}</h2>
              <p className="text-slate-400">{t('cc.attributes_sub', language)}</p>
            </div>

            <div className="space-y-6">
              {[
                { key: 'strength', name: attrLabel[language].strength, icon: Sword, desc: language === 'ru' ? 'Физическая сила и бой' : 'Physical power and combat' },
                { key: 'intelligence', name: attrLabel[language].intelligence, icon: Brain, desc: language === 'ru' ? 'Магия и решение задач' : 'Magic and problem-solving' },
                { key: 'charisma', name: attrLabel[language].charisma, icon: Heart, desc: language === 'ru' ? 'Убеждение и лидерство' : 'Persuasion and leadership' },
                { key: 'agility', name: attrLabel[language].agility, icon: Zap, desc: language === 'ru' ? 'Скорость и скрытность' : 'Speed and stealth' },
                { key: 'wisdom', name: attrLabel[language].wisdom, icon: Eye, desc: language === 'ru' ? 'Восприятие и интуиция' : 'Perception and insight' },
                { key: 'luck', name: attrLabel[language].luck, icon: Sparkles, desc: language === 'ru' ? 'Случай и удача' : 'Fortune and chance' }
              ].map((attr) => (
                <div key={attr.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <attr.icon className="w-4 h-4 text-violet-400" />
                      <span className="font-medium">{attr.name}</span>
                    </div>
                    <span className="text-violet-400 font-bold">
                      {character.attributes?.[attr.key as keyof typeof character.attributes]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{attr.desc}</p>
                  <Slider
                    value={[character.attributes?.[attr.key as keyof typeof character.attributes] || 10]}
                    onValueChange={([v]) => updateAttribute(attr.key, v)}
                    min={5}
                    max={18}
                    step={1}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'personality':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t('cc.personality', language)}</h2>
              <p className="text-slate-400">{t('cc.personality_sub', language)}</p>
            </div>

            <div className="space-y-6">
              {[
                { key: 'brave', name: language === 'ru' ? 'Храбрость' : 'Bravery', left: language === 'ru' ? 'Осторожный' : 'Cautious', right: language === 'ru' ? 'Бесстрашный' : 'Fearless' },
                { key: 'cunning', name: language === 'ru' ? 'Хитрость' : 'Cunning', left: language === 'ru' ? 'Прямолинейный' : 'Honest', right: language === 'ru' ? 'Коварный' : 'Deceptive' },
                { key: 'kind', name: language === 'ru' ? 'Доброта' : 'Kindness', left: language === 'ru' ? 'Прагматичный' : 'Pragmatic', right: language === 'ru' ? 'Сострадательный' : 'Compassionate' },
                { key: 'ruthless', name: language === 'ru' ? 'Безжалостность' : 'Ruthlessness', left: language === 'ru' ? 'Милосердный' : 'Merciful', right: language === 'ru' ? 'Жестокий' : 'Ruthless' },
                { key: 'honorable', name: language === 'ru' ? 'Честь' : 'Honor', left: language === 'ru' ? 'Прагматичный' : 'Pragmatic', right: language === 'ru' ? 'Принципиальный' : 'Principled' },
                { key: 'mysterious', name: language === 'ru' ? 'Таинственность' : 'Mystery', left: language === 'ru' ? 'Открытый' : 'Open', right: language === 'ru' ? 'Загадочный' : 'Enigmatic' }
              ].map((trait) => (
                <div key={trait.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{trait.left}</span>
                    <span className="font-medium">{trait.name}</span>
                    <span className="text-slate-500">{trait.right}</span>
                  </div>
                  <Slider
                    value={[character.personality?.[trait.key as keyof typeof character.personality] || 50]}
                    onValueChange={([v]) => updatePersonality(trait.key, v)}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'tone':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">{t('cc.tone', language)}</h2>
              <p className="text-slate-400">{t('cc.tone_sub', language)}</p>
            </div>

            <div className="grid gap-4">
              {storyTonesBase.map((tone) => {
                const txt = storyTonesText[language][tone.id];
                return (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTone === tone.id
                        ? 'border-[var(--chronos-primary-hex)]/55 bg-[var(--chronos-primary-hex)]/10 shadow-[0_0_28px_rgba(102,252,241,0.14)] ring-1 ring-[var(--chronos-primary-hex)]/25'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tone.color} flex items-center justify-center`}>
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{txt.name}</h3>
                        <p className="text-sm text-slate-400">{txt.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2">{t('cc.confirm_title', language)}</h2>
              <p className="text-slate-400">
                {player?.character.name},{' '}
                {language === 'ru'
                  ? `происхождение: ${originsText[language][(character.origin as OriginId) || 'village']?.name ?? ''}`
                  : `the ${originsText[language][(character.origin as OriginId) || 'village']?.name ?? ''}`}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">{language === 'ru' ? 'Происхождение' : 'Origin'}</span>
                    <p className="font-medium">{originsText[language][(character.origin as OriginId) || 'village']?.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">{language === 'ru' ? 'Тон истории' : 'Story Tone'}</span>
                    <p className="font-medium">{storyTonesText[language][selectedTone as keyof typeof storyTonesText.ru]?.name}</p>
                </div>
                <div>
                  <span className="text-slate-500">{language === 'ru' ? 'Эпоха' : 'Era'}</span>
                  <p className="font-medium">
                    {character.worldEra === 'modern'
                      ? t('cc.era_modern', language)
                      : character.worldEra === 'future'
                        ? t('cc.era_future', language)
                        : t('cc.era_medieval', language)}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <span className="text-slate-500 text-sm">
                  {language === 'ru' ? 'Графический профиль' : 'Graphics profile'}
                </span>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {([
                    { id: 'performance', ru: 'Производительность', en: 'Performance' },
                    { id: 'balanced', ru: 'Сбалансированный', en: 'Balanced' },
                    { id: 'cinematic', ru: 'Кинематограф', en: 'Cinematic' }
                  ] as const).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setGraphicsProfile(p.id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                        graphicsProfile === p.id
                          ? 'border-violet-400/60 bg-violet-500/20 text-violet-100'
                          : 'border-slate-700 bg-slate-900/70 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {language === 'ru' ? p.ru : p.en}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <span className="text-slate-500 text-sm">{language === 'ru' ? 'Сильные стороны' : 'Top Attributes'}</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {Object.entries(character.attributes || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([attr, val]) => (
                      <span key={attr} className="bg-violet-500/20 text-violet-300 px-3 py-1 rounded-full text-sm">
                        {(attrLabel[language] as Record<string, string>)[attr] ?? attr}: {val}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <Button
              data-testid="cc-enter-world"
              onClick={handleComplete}
              size="lg"
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              {t('cc.enter_world', language)}
            </Button>
          </div>
        );
    }
  };

  const steps: CreationStep[] = ['origin', 'era', 'attributes', 'personality', 'tone', 'confirm'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-5 sm:p-8"
      data-testid="character-creation-root"
    >
      <div className="w-full max-w-lg chronos-panel p-6 sm:p-8 ring-1 ring-white/[0.04]">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStepIndex ? 'bg-violet-500' : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        {renderStep()}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            data-testid="cc-back"
            onClick={() => {
              const prevIndex = currentStepIndex - 1;
              if (prevIndex >= 0) setStep(steps[prevIndex]);
            }}
            disabled={currentStepIndex === 0}
            className="text-slate-500"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('cc.back', language)}
          </Button>

          {step !== 'confirm' && (
            <Button
              data-testid="cc-next"
              onClick={() => {
                const nextIndex = currentStepIndex + 1;
                if (nextIndex < steps.length) setStep(steps[nextIndex]);
              }}
              className="bg-violet-600 hover:bg-violet-500"
            >
              {t('cc.next', language)}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
