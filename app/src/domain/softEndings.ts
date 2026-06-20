// softEndings.ts — Soft ending detection system.
// Detects alternative ending paths based on player progress and choices.

import type { SoftEnding, Player, StoryProgress } from '@/types/game';

/** Predefined soft endings for the game */
export const SOFT_ENDINGS: SoftEnding[] = [
  {
    id: 'ending_friend_of_people',
    title: { ru: 'Друг народа', en: 'Friend of the People' },
    description: {
      ru: 'Вы стали настоящим другом для жителей региона. Вашу доброту помнят и передают из уст в уста.',
      en: 'You became a true friend to the people of the region. Your kindness is remembered and passed down.'
    },
    conditions: {
      minQuestsCompleted: 5,
      minReputation: { 'village': 50 }
    },
    priority: 10
  },
  {
    id: 'ending_trade_tycoon',
    title: { ru: 'Торговый магнат', en: 'Trade Tycoon' },
    description: {
      ru: 'Ваше имя знают торговцы по всем караванным путям. Кредит в любой лавке обеспечен.',
      en: 'Your name is known to merchants across all trade routes. Credit in any shop is guaranteed.'
    },
    conditions: {
      minQuestsCompleted: 3,
      minReputation: { 'merchants': 30 }
    },
    priority: 8
  },
  {
    id: 'ending_wild_card',
    title: { ru: 'Дикая карта', en: 'Wild Card' },
    description: {
      ru: 'О вас ходят легенды — некоторые добрые, некоторые не очень. Мир запомнит вас непредсказуемым.',
      en: 'Legends circulate about you — some kind, some not so much. The world remembers you as unpredictable.'
    },
    conditions: {
      requiredChoices: ['rough_choice', 'diplomatic_choice']
    },
    priority: 5
  },
  {
    id: 'ending_survivor',
    title: { ru: 'Выживший', en: 'The Survivor' },
    description: {
      ru: 'Вы прошли через многое и остались стоять. Это уже немало.',
      en: 'You have been through much and remained standing. That is already a lot.'
    },
    conditions: {
      minHoursPlayed: 10,
      minQuestsCompleted: 1
    },
    priority: 3
  },
  {
    id: 'ending_novice',
    title: { ru: 'Новичок', en: 'The Novice' },
    description: {
      ru: 'Ваше путешествие только начинается. Впереди ещё много приключений.',
      en: 'Your journey is just beginning. Many adventures still lie ahead.'
    },
    conditions: {
      minQuestsCompleted: 0
    },
    priority: 1
  }
];

/** Check which soft endings are available for a player */
export function detectSoftEndings(player: Player, storyProgress: StoryProgress): SoftEnding[] {
  const available: SoftEnding[] = [];
  const completedQuests = new Set(storyProgress.completedQuests);
  const choices = new Set(player.choices?.map(c => c.id) ?? []);

  for (const ending of SOFT_ENDINGS) {
    if (isEndingAvailable(ending, player, storyProgress, completedQuests, choices)) {
      available.push(ending);
    }
  }

  // Sort by priority (highest first)
  return available.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

/** Check if a single ending is available */
function isEndingAvailable(
  ending: SoftEnding,
  player: Player,
  storyProgress: StoryProgress,
  completedQuests: Set<string>,
  choices: Set<string>
): boolean {
  const cond = ending.conditions;

  // Check minimum quests completed
  if (cond.minQuestsCompleted !== undefined) {
    if (storyProgress.completedQuests.length < cond.minQuestsCompleted) {
      return false;
    }
  }

  // Check required quest completed
  if (cond.requiredQuestId) {
    if (!completedQuests.has(cond.requiredQuestId)) {
      return false;
    }
  }

  // Check faction reputation
  if (cond.minReputation) {
    const factionRep = storyProgress.factionReputation ?? player.stats.reputation;
    for (const [factionId, minValue] of Object.entries(cond.minReputation)) {
      const current = factionRep instanceof Map ? factionRep.get(factionId) ?? 0 : (factionRep as Record<string, number>)[factionId] ?? 0;
      if ((current as number) < minValue) {
        return false;
      }
    }
  }

  // Check required achievements
  if (cond.requiredAchievements) {
    const achievements = new Set(player.stats.achievements ?? []);
    for (const achievement of cond.requiredAchievements) {
      if (!achievements.has(achievement)) {
        return false;
      }
    }
  }

  // Check required choices
  if (cond.requiredChoices) {
    for (const choice of cond.requiredChoices) {
      if (!choices.has(choice)) {
        return false;
      }
    }
  }

  // Check minimum hours played (from playedTime)
  if (cond.minHoursPlayed !== undefined) {
    const hoursPlayed = (player.stats.playedTime ?? 0) / 3600000;
    if (hoursPlayed < cond.minHoursPlayed) {
      return false;
    }
  }

  return true;
}

/** Get the best available ending for a player */
export function getBestEnding(player: Player, storyProgress: StoryProgress): SoftEnding | null {
  const available = detectSoftEndings(player, storyProgress);
  return available[0] ?? null;
}