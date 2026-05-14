// Локализация процедурного сюжета: RU по умолчанию, EN — полный параллель.
import type { Atmosphere, EmotionState, PlayerArchetype, StoryTone } from '@/types/game';
import { getLanguage, type Language } from '@/i18n';

export interface StoryTemplate {
  id: string;
  tone: StoryTone;
  archetypes: PlayerArchetype[];
  openings: string[];
  developments: string[];
  climaxes: string[];
  resolutions: string[];
}

export interface DialogueTemplate {
  emotion: string;
  templates: string[];
}

export interface ChoiceArchetype {
  type: 'heroic' | 'pragmatic' | 'cunning' | 'compassionate' | 'ruthless';
  label: string;
  description: string;
}

export interface StoryEngineBundle {
  storyTemplates: StoryTemplate[];
  dialogueTemplates: DialogueTemplate[];
  choiceArchetypes: ChoiceArchetype[];
  locationDescriptions: Record<string, string[]>;
  moods: Record<EmotionState, string[]>;
  flavors: Record<EmotionState, string[]>;
  continuityReferences: string[];
  topicContexts: Record<string, string[]>;
  atmosphereMoods: Record<EmotionState, string[]>;
  atmosphereLightings: string[];
  atmosphereSounds: string[];
  atmosphereMusics: string[];
  choiceTexts: Record<string, string[]>;
  questPrefixes: Record<string, string[]>;
  questSuffixes: Record<StoryTone, string[]>;
  objectiveDescriptions: Record<string, string[]>;
  fallbackNPC: { name: string; title: string };
}

function bundleRu(): StoryEngineBundle {
  const storyTemplates: StoryTemplate[] = [
    {
      id: 'heroic_journey',
      tone: 'heroic',
      archetypes: ['achiever', 'killer'],
      openings: [
        'Колокола деревни бьют тревогу. Дым на горизонте, и отчаянные взгляды обращены к вам.',
        'Королевский гонец падает у ваших ног, сжимая запечатанный указ с печатью.',
        'Древнее пророчество говорило о избранном. Сегодня этот избранный — вы.'
      ],
      developments: [
        'Союзники собираются рядом, влекомые растущей легендой о вас.',
        'Каждая победа открывает более тёмную правду под поверхностью.',
        'Враг подстраивается под ваши приёмы — вам приходится меняться.'
      ],
      climaxes: [
        'Решающее столкновение ждёт в самом сердце тьмы.',
        'Всё, за что вы боролись, висит на волоске.',
        'Ваш главный союзник становится самой опасной угрозой.'
      ],
      resolutions: [
        'Мир возвращается — но какой ценой? Шрамы остаются.',
        'Наступает новая эра, выкованная вашими решениями.',
        'Круг замыкается, но вы изменили его ход.'
      ]
    },
    {
      id: 'mystery_unveiling',
      tone: 'mysterious',
      archetypes: ['explorer', 'storyteller'],
      openings: [
        'Письмо пришло без подписи. Внутри одна фраза: «За вами следят».',
        'В полночь разбились все зеркала в городе. Никто не знает почему.',
        'Вы проснулись с символом на ладони. Он пульсирует чужой силой.'
      ],
      developments: [
        'Следы ведут в заговор, тянущийся через века.',
        'Ничто не то, чем кажется. Доверие становится редкостью.',
        'Древние тайны всплывают, руша то, во что вы верили.'
      ],
      climaxes: [
        'Правда страшнее любой лжи.',
        'Последняя деталь складывает целую картину.',
        'Выбирать между знанием и безопасностью.'
      ],
      resolutions: [
        'Некоторые тайны лучше не тревожить.',
        'Правда освобождает — но свобода имеет цену.',
        'Из ответов рождаются новые вопросы.'
      ]
    },
    {
      id: 'dark_descent',
      tone: 'dark',
      archetypes: ['killer', 'storyteller'],
      openings: [
        'Дождь смывает кровь — но не вину.',
        'Власть требует жертв. Вы уже отдали немало.',
        'В тени вы нашли себя настоящего. И это пугает.'
      ],
      developments: [
        'Каждый шаг во тьму отдаляет свет.',
        'Мораль — роскошь, которую вы не можете позволить.',
        'Грань между чудовищем и героем стирается.'
      ],
      climaxes: [
        'Принять тьму или быть поглощённым ею.',
        'Главный враг — тот, кем вы стали.',
        'Искупление кажется невозможным — но зов слышен.'
      ],
      resolutions: [
        'Тьма берёт своё.',
        'Остаётся слабый огонёк — хрупкий, но настоящий.',
        'Вы изменились навсегда — ни герой, ни злодей.'
      ]
    },
    {
      id: 'whimsical_adventure',
      tone: 'whimsical',
      archetypes: ['explorer', 'socializer'],
      openings: [
        'Говорящий кот предлагает квест. Награда? «Очень хорошая история».',
        'Облака сложились в карту. Куда она ведёт?',
        'Вас пригласили на чай к Королю гоблинов. Отказ не принимается.'
      ],
      developments: [
        'Невозможное случается с пугающей регулярностью.',
        'Друзья появляются там, где их не ждёшь.',
        'Логика в отпуске — на её месте чудо.'
      ],
      climaxes: [
        'Абсурд становится глубиной, смех — серьёзностью.',
        'Спасти мир остроумием и добротой — больше ничего нет.',
        'Финал — игра; проигрыш значит всё.'
      ],
      resolutions: [
        'Магия остаётся в мире — если знать, куда смотреть.',
        'Приключение не кончается — оно меняет форму.',
        'Вы поняли: радость — тоже сила.'
      ]
    }
  ];

  const dialogueTemplates: DialogueTemplate[] = [
    {
      emotion: 'neutral',
      templates: [
        '{playerName}, говорите по делу — в «хронике» лишние слова только шум.',
        'Слушаю. Что именно вас привело сюда, {playerName}?',
        'Время дорого. Один вопрос — одна честная линия ответа, {playerName}.',
        '{playerName}, без метафор: что вы хотите узнать?'
      ]
    },
    {
      emotion: 'grateful',
      templates: [
        'Не знаю, как вас благодарить, {playerName}.',
        'Вы вернули мне надежду, когда её не осталось.',
        'Я в долгу перед вами — не забуду.',
        'Слов не хватит выразить благодарность.'
      ]
    },
    {
      emotion: 'angry',
      templates: [
        'Как вы смеете показываться здесь!',
        'Ваши поступки имеют последствия, {playerName}.',
        'Я думал, могу вам доверять. Ошибался.',
        'Сегодня вы сделали себе врага.'
      ]
    },
    {
      emotion: 'fearful',
      templates: [
        'Прошу… не причиняйте вреда.',
        'Что-то ужасное близко. Я это чувствую.',
        'Я видел то, что ломает разум.',
        'Говорите тише. Нас могут слышать.'
      ]
    },
    {
      emotion: 'curious',
      templates: [
        'Расскажите подробнее об этой… теории.',
        'Я никогда не видел ничего подобного. Что это?',
        'Мир полон тайн, не правда ли?',
        'Знание — сила, и я хочу обоих.'
      ]
    },
    {
      emotion: 'suspicious',
      templates: [
        'Чего вы на самом деле хотите, {playerName}?',
        'У каждого свой интерес. Какой у вас?',
        'Я научился верить поступкам, а не словам.',
        'Докажите, что вы не как все.'
      ]
    }
  ];

  const choiceArchetypes: ChoiceArchetype[] = [
    { type: 'heroic', label: 'Героизм', description: 'Сделать правильное, какой бы ценой ни было' },
    { type: 'pragmatic', label: 'Прагматизм', description: 'Выбрать самый рациональный ход' },
    { type: 'cunning', label: 'Хитрость', description: 'Найти обходной путь' },
    { type: 'compassionate', label: 'Сострадание', description: 'Поставить людей на первое место' },
    { type: 'ruthless', label: 'Беспощадность', description: 'Добиться цели любой ценой' }
  ];

  const locationDescriptions: Record<string, string[]> = {
    city: [
      'Город раскинулся перед вами — лабиринт камня и тени.',
      'Улицы шумят жизнью; у каждого прохожего своя тайна.',
      'Шпили уходят в облака — памятники честолюбию.'
    ],
    forest: [
      'Древние деревья шепчут тайны старше памяти.',
      'Сквозь кроны струится свет, рисуя узоры на земле.',
      'Лес затаил дыхание и наблюдает.'
    ],
    dungeon: [
      'Тьма давит на свет факела, жадная и терпеливая.',
      'Стены сырость стекают — свидетели веков страданий.',
      'Каждая тень может скрывать смерть — или хуже.'
    ],
    mountain: [
      'Вершина вздымается над вами, безразличная к вашей борьбе.',
      'Ветер воет на утёсах, поёт о льде и камне.',
      'Разряжённый воздух напоминает, как вы малы.'
    ],
    ruins: [
      'Руины хранят эхо былой славы и падения.',
      'Между обломками витает древняя магия — осторожно.',
      'Камни помнят тех, кто здесь погиб.'
    ]
  };

  const moods: Record<EmotionState, string[]> = {
    neutral: ['Сегодня что-то не так, как обычно.', 'Воздух неподвижен.'],
    excited: ['Сердце бьётся в предвождении.', 'Зов приключения — и вы откликаетесь.'],
    frustrated: ['Преграды кажутся непреодолимыми.', 'Сегодня ничего не даётся легко.'],
    curious: ['Вопросы роятся на краю сознания.', 'Тайны манят из каждого угла.'],
    bored: ['Мир кажется серым, ждущим краски.', 'Нетерпение грызёт изнутри.'],
    stressed: ['Опасность чувствуется в каждой тени.', 'Нервы натянуты до предела.'],
    relaxed: ['Покой окутывает вас, как тёплое одеяло.', 'Пока всё спокойно.']
  };

  const flavors: Record<EmotionState, string[]> = {
    neutral: ['Вы собираете мысли с холодной ясностью.'],
    excited: ['Чувства обострены; мир ярче.'],
    frustrated: ['Вы сжимаете кулаки — не сдаваться.'],
    curious: ['Взгляд ищет детали, смысл, зацепки.'],
    bored: ['Вы ловите себя на мысли: что принесёт завтра?'],
    stressed: ['Глубокий вдох — вы пытаетесь удержать центр.'],
    relaxed: ['Вы позволяете себе эту минуту тишины.']
  };

  const continuityReferences = [
    'Прошлые решения отзываются в настоящем.',
    'Чувствуете: всё связано.',
    'Путь позади формирует дорогу впереди.',
    'Память и судьба переплетаются.'
  ];

  const topicContexts: Record<string, string[]> = {
    quest: [
      'Я как раз ждал кого-то вроде вас для этого дела.',
      'Впереди задача не для слабых духом.'
    ],
    rumor: [
      'Говорят, на окраинах творится странное.',
      'В городе сплетни бегают быстрее лошадей.'
    ],
    personal: [
      'Немногие интересуются моей жизнью.',
      'Думаю, могу доверить вам это…'
    ]
  };

  const atmosphereMoods: Record<EmotionState, string[]> = {
    neutral: ['спокойное', 'тихое', 'обычное'],
    excited: ['электрическое', 'напряжённое', 'живое'],
    frustrated: ['тяжёлое', 'душное', 'угнетающее'],
    curious: ['загадочное', 'манящее', 'неясное'],
    bored: ['пустое', 'серое', 'бесцветное'],
    stressed: ['зловещее', 'угрожающее', 'опасное'],
    relaxed: ['мирное', 'безмятежное', 'тихое']
  };

  const atmosphereLightings = ['тусклое', 'яркое', 'в тени', 'золотое', 'бледное', 'мерцающее'];
  const atmosphereSounds = ['ветер', 'голоса вдали', 'шаги', 'биение сердца', 'тишина', 'шёпот'];
  const atmosphereMusics = ['амбент', 'напряжённая', 'загадочная', 'эпическая', 'меланхоличная', 'надежда'];

  const choiceTexts: Record<string, string[]> = {
    heroic: [
      'Идти напролом, защищая тех, кто в {location} рассчитывает на вас.',
      'Держать строй, какой бы ценой ни было.',
      'Сделать правильное — даже если это трудно.'
    ],
    pragmatic: [
      'Найти самый эффективный способ выйти из ситуации в {location}.',
      'Взвесить риски и выгоду для людей в {location}.',
      'Выбрать путь наименьшего сопротивления — пока он безопасен.'
    ],
    cunning: [
      'Найти хитрый способ перевернуть ситуацию в {location} в свою пользу.',
      'Использовать обман и отвлечение — пока в {location} никто не смотрит.',
      'Найти слабое место в плане того, кто держит {location}.'
    ],
    compassionate: [
      'Поставить безопасность жителей {location} выше своей.',
      'Проявить милость — даже к врагу в {location}.',
      'Помочь нуждающимся в {location}, несмотря на риск.'
    ],
    ruthless: [
      'Сделать всё необходимое ради цели — даже если {location} пострадает.',
      'Убрать препятствия в {location} без колебаний.',
      'Победа оправдывает средства здесь и в {location}.'
    ]
  };

  const questPrefixes: Record<string, string[]> = {
    main: ['', 'Хроники', 'Легенда о', 'Восход'],
    side: ['', 'Пропавшие', 'Беда в', 'Тайна'],
    character: ['Воспоминания', 'Путь', 'Испытания', 'Тень']
  };

  const questSuffixes: Record<StoryTone, string[]> = {
    heroic: ['героя', 'рассвета', 'победы', 'света'],
    dark: ['тьмы', 'теней', 'крови', 'ночи'],
    mysterious: ['тайны', 'шёпота', 'загадки', 'неизвестного'],
    whimsical: ['чуда', 'магии', 'снов', 'хаоса'],
    tragic: ['печали', 'потери', 'падения', 'конца'],
    epic: ['веков', 'легенд', 'богов', 'вечности']
  };

  const objectiveDescriptions: Record<string, string[]> = {
    reach_location: [
      'Добраться до указанного места.',
      'Найти путь к цели.',
      'Дойти до отмеченной точки на карте.'
    ],
    talk_to_npc: [
      'Поговорить с контактом.',
      'Разыскать информатора.',
      'Допросить свидетеля.'
    ],
    collect_item: [
      'Достать нужный предмет.',
      'Собрать необходимое.',
      'Найти и взять объект.'
    ],
    defeat_enemy: [
      'Устранить угрозу.',
      'Победить противника.',
      'Сломить вражескую силу.'
    ],
    solve_puzzle: [
      'Разгадать тайну.',
      'Раскрыть древний механизм.',
      'Решить загадку.'
    ]
  };

  return {
    storyTemplates,
    dialogueTemplates,
    choiceArchetypes,
    locationDescriptions,
    moods,
    flavors,
    continuityReferences,
    topicContexts,
    atmosphereMoods,
    atmosphereLightings,
    atmosphereSounds,
    atmosphereMusics,
    choiceTexts,
    questPrefixes,
    questSuffixes,
    objectiveDescriptions,
    fallbackNPC: { name: 'Незнакомец', title: 'Прохожий' }
  };
}

function bundleEn(): StoryEngineBundle {
  const storyTemplates: StoryTemplate[] = [
    {
      id: 'heroic_journey',
      tone: 'heroic',
      archetypes: ['achiever', 'killer'],
      openings: [
        'The village bells ring with alarm. Smoke rises from the horizon, and desperate eyes turn to you.',
        'A royal messenger collapses at your feet, clutching a sealed decree bearing the king\'s seal.',
        'The ancient prophecy spoke of a champion. Today, that champion is you.'
      ],
      developments: [
        'Allies gather at your side, drawn by your growing legend.',
        'Each victory reveals a darker truth lurking beneath the surface.',
        'The enemy adapts to your tactics, forcing you to evolve.'
      ],
      climaxes: [
        'The final confrontation awaits at the heart of darkness.',
        'Everything you\'ve fought for hangs in the balance.',
        'Your greatest ally becomes your most dangerous foe.'
      ],
      resolutions: [
        'Peace returns, but at what cost? The scars remain.',
        'A new era dawns, shaped by your choices.',
        'The cycle continues, but you have changed its course.'
      ]
    },
    {
      id: 'mystery_unveiling',
      tone: 'mysterious',
      archetypes: ['explorer', 'storyteller'],
      openings: [
        'The letter arrived without a sender. Inside, a single phrase: "They\'re watching."',
        'Every mirror in the city shattered at midnight. No one knows why.',
        'You woke with a symbol burned into your palm. It pulses with unknown power.'
      ],
      developments: [
        'Clues lead you deeper into a conspiracy spanning centuries.',
        'Nothing is as it seems. Trust becomes a precious commodity.',
        'Ancient secrets surface, challenging everything you believed.'
      ],
      climaxes: [
        'The truth is more terrible than any lie.',
        'The final piece of the puzzle reveals the whole picture.',
        'You must choose between knowledge and safety.'
      ],
      resolutions: [
        'Some mysteries are better left unsolved.',
        'The truth sets you free, but freedom has its price.',
        'New questions emerge from the answers you found.'
      ]
    },
    {
      id: 'dark_descent',
      tone: 'dark',
      archetypes: ['killer', 'storyteller'],
      openings: [
        'The rain washes away the blood, but not the guilt.',
        'Power demands sacrifice. You\'ve already given so much.',
        'In the shadows, you found your true self. And it terrifies you.'
      ],
      developments: [
        'Each step into darkness makes the light more distant.',
        'Morality becomes a luxury you can no longer afford.',
        'The line between monster and hero blurs with every choice.'
      ],
      climaxes: [
        'Embrace the darkness, or be consumed by it.',
        'Your greatest enemy is the person you\'ve become.',
        'Redemption seems impossible, yet it calls to you.'
      ],
      resolutions: [
        'The darkness claims its due.',
        'A glimmer of light remains, fragile but real.',
        'You are forever changed, neither hero nor villain.'
      ]
    },
    {
      id: 'whimsical_adventure',
      tone: 'whimsical',
      archetypes: ['explorer', 'socializer'],
      openings: [
        'A talking cat offers you a quest. The reward? "A really good story."',
        'The clouds have arranged themselves into a map. Where do they lead?',
        'You\'ve been invited to the Goblin King\'s tea party. RSVP: mandatory.'
      ],
      developments: [
        'Impossible things happen with alarming regularity.',
        'Friends appear in the unlikeliest of places.',
        'Logic takes a holiday, and wonder fills the void.'
      ],
      climaxes: [
        'The absurd becomes profound, the silly becomes serious.',
        'You must save the world with nothing but wit and kindness.',
        'The final challenge is a game, and losing means everything.'
      ],
      resolutions: [
        'Magic remains in the world, if you know where to look.',
        'The adventure never truly ends, it just changes shape.',
        'You\'ve learned that joy is its own kind of power.'
      ]
    }
  ];

  const dialogueTemplates: DialogueTemplate[] = [
    {
      emotion: 'neutral',
      templates: [
        '{playerName}, say what you need—the chronicle has no patience for filler.',
        'I am listening. What brought you here, {playerName}?',
        'Time is costly. One question, one straight answer, {playerName}.',
        '{playerName}, plainly: what do you want to know?'
      ]
    },
    {
      emotion: 'grateful',
      templates: [
        'I cannot thank you enough, {playerName}.',
        'You\'ve given me hope when I had none.',
        'I owe you my life, and I won\'t forget it.',
        'Words fail to express my gratitude.'
      ]
    },
    {
      emotion: 'angry',
      templates: [
        'How dare you show your face here!',
        'Your actions have consequences, {playerName}.',
        'I thought I could trust you. I was wrong.',
        'You\'ve made a powerful enemy today.'
      ]
    },
    {
      emotion: 'fearful',
      templates: [
        'Please, I\'m begging you... don\'t hurt me.',
        'Something terrible is coming. I can feel it.',
        'I\'ve seen things that would break your mind.',
        'Keep your voice down. They\'re listening.'
      ]
    },
    {
      emotion: 'curious',
      templates: [
        'Tell me more about this... theory of yours.',
        'I\'ve never seen anything like it. What is it?',
        'The world is full of mysteries, isn\'t it?',
        'Knowledge is power, and I seek both.'
      ]
    },
    {
      emotion: 'suspicious',
      templates: [
        'What do you really want, {playerName}?',
        'Everyone has an angle. What\'s yours?',
        'I\'ve learned to trust actions, not words.',
        'Prove that you\'re different from the others.'
      ]
    }
  ];

  const choiceArchetypes: ChoiceArchetype[] = [
    { type: 'heroic', label: 'Heroic', description: 'Do what is right, regardless of cost' },
    { type: 'pragmatic', label: 'Pragmatic', description: 'Choose the most practical solution' },
    { type: 'cunning', label: 'Cunning', description: 'Find a clever way around the problem' },
    { type: 'compassionate', label: 'Compassionate', description: 'Prioritize helping others' },
    { type: 'ruthless', label: 'Ruthless', description: 'Do whatever it takes to succeed' }
  ];

  const locationDescriptions: Record<string, string[]> = {
    city: [
      'The city sprawls before you, a maze of stone and shadow.',
      'Streets bustle with life, each passerby hiding their own secrets.',
      'Towering spires pierce the clouds, monuments to ambition and pride.'
    ],
    forest: [
      'Ancient trees whisper secrets older than memory.',
      'Sunlight filters through the canopy in dancing patterns.',
      'The forest holds its breath, watching, waiting.'
    ],
    dungeon: [
      'Darkness presses against your torchlight, hungry and patient.',
      'Stone walls weep with moisture, bearing witness to centuries of suffering.',
      'Every shadow might hide death, or worse.'
    ],
    mountain: [
      'The peak looms above, indifferent to your struggle.',
      'Wind howls across jagged cliffs, singing songs of ice and stone.',
      'The thin air reminds you how small you are.'
    ],
    ruins: [
      'Crumbling walls remember glory and ruin in equal measure.',
      'Old magic clings to the stones — tread carefully.',
      'The stones remember those who fell here.'
    ]
  };

  const moods: Record<EmotionState, string[]> = {
    neutral: ['Something feels different today.', 'The air is still.'],
    excited: ['Your heart races with anticipation.', 'Adventure calls, and you answer.'],
    frustrated: ['Obstacles loom large, testing your resolve.', 'Nothing comes easily today.'],
    curious: ['Questions dance at the edge of your mind.', 'Mysteries beckon from every corner.'],
    bored: ['The world seems gray, waiting for color.', 'Restlessness gnaws at your patience.'],
    stressed: ['Danger lurks in every shadow.', 'Your nerves are stretched thin.'],
    relaxed: ['Peace settles over you like a warm blanket.', 'For now, all is well.']
  };

  const flavors: Record<EmotionState, string[]> = {
    neutral: ['You take a moment to gather your thoughts.'],
    excited: ['Every sense feels heightened, alive.'],
    frustrated: ['You clench your fists, refusing to give up.'],
    curious: ['Your eyes search for clues, answers, meaning.'],
    bored: ['You wonder what excitement tomorrow might bring.'],
    stressed: ['You take a deep breath, centering yourself.'],
    relaxed: ['You allow yourself this moment of peace.']
  };

  const continuityReferences = [
    'Your past choices echo in the present.',
    'You sense that everything is connected.',
    'The path behind you shapes the road ahead.',
    'Memory and destiny intertwine.'
  ];

  const topicContexts: Record<string, string[]> = {
    quest: [
      `I've been waiting for someone like you to help with this matter.`,
      `The task ahead is not for the faint of heart.`
    ],
    rumor: [
      `They say strange things are happening in the outskirts.`,
      `Whispers travel fast in this city.`
    ],
    personal: [
      `Not many people ask about my life.`,
      `I suppose I can trust you with this...`
    ]
  };

  const atmosphereMoods: Record<EmotionState, string[]> = {
    neutral: ['calm', 'quiet', 'ordinary'],
    excited: ['electric', 'charged', 'thrumming'],
    frustrated: ['tense', 'heavy', 'oppressive'],
    curious: ['mysterious', 'intriguing', 'enigmatic'],
    bored: ['dull', 'lifeless', 'gray'],
    stressed: ['ominous', 'foreboding', 'dangerous'],
    relaxed: ['peaceful', 'serene', 'tranquil']
  };

  const atmosphereLightings = ['dim', 'bright', 'shadowy', 'golden', 'pale', 'flickering'];
  const atmosphereSounds = ['wind', 'distant voices', 'footsteps', 'heartbeat', 'silence', 'whispers'];
  const atmosphereMusics = ['ambient', 'tense', 'mysterious', 'epic', 'melancholic', 'hopeful'];

  const choiceTexts: Record<string, string[]> = {
    heroic: [
      'Confront the danger head-on, protecting whoever in {location} is counting on you.',
      'Stand your ground, no matter the cost.',
      'Do what is right, even if it is hard.'
    ],
    pragmatic: [
      'Find the most efficient way out of the situation in {location}.',
      'Weigh risks and benefits for people in {location}.',
      'Choose the path of least resistance—while it stays safe.'
    ],
    cunning: [
      'Look for a clever way to turn the situation in {location} to your advantage.',
      'Use deception and misdirection while {location} looks away.',
      'Find the weakness in whoever controls {location}.'
    ],
    compassionate: [
      'Prioritize the safety of people in {location} over your own.',
      'Show mercy, even to an enemy in {location}.',
      'Help those in need in {location}, regardless of the risk.'
    ],
    ruthless: [
      'Do whatever is necessary—even if {location} pays part of the price.',
      'Eliminate obstacles in {location} without hesitation.',
      'Victory justifies the means here and in {location}.'
    ]
  };

  const questPrefixes: Record<string, string[]> = {
    main: ['The', 'Chronicles of', 'Legend of', 'Rise of'],
    side: ['A', 'The Missing', 'Trouble in', 'Mystery of'],
    character: ['Memories of', 'Path of', 'Trials of', 'Shadow of']
  };

  const questSuffixes: Record<StoryTone, string[]> = {
    heroic: ['Hero', 'Dawn', 'Victory', 'Light'],
    dark: ['Darkness', 'Shadows', 'Blood', 'Night'],
    mysterious: ['Secrets', 'Whispers', 'Enigma', 'Unknown'],
    whimsical: ['Wonder', 'Magic', 'Dreams', 'Chaos'],
    tragic: ['Sorrow', 'Loss', 'Fall', 'End'],
    epic: ['Ages', 'Legends', 'Gods', 'Eternity']
  };

  const objectiveDescriptions: Record<string, string[]> = {
    reach_location: [
      'Journey to the specified location.',
      'Find your way to the destination.',
      'Travel to the marked point on your map.'
    ],
    talk_to_npc: [
      'Speak with the contact.',
      'Seek out the informant.',
      'Question the witness.'
    ],
    collect_item: [
      'Retrieve the required item.',
      'Gather the necessary components.',
      'Find and collect the object.'
    ],
    defeat_enemy: [
      'Eliminate the threat.',
      'Defeat the opposing force.',
      'Overcome the enemy.'
    ],
    solve_puzzle: [
      'Unlock the mystery.',
      'Decipher the ancient mechanism.',
      'Solve the riddle before you.'
    ]
  };

  return {
    storyTemplates,
    dialogueTemplates,
    choiceArchetypes,
    locationDescriptions,
    moods,
    flavors,
    continuityReferences,
    topicContexts,
    atmosphereMoods,
    atmosphereLightings,
    atmosphereSounds,
    atmosphereMusics,
    choiceTexts,
    questPrefixes,
    questSuffixes,
    objectiveDescriptions,
    fallbackNPC: { name: 'Unknown', title: 'Stranger' }
  };
}

let _bundleCache: { lang: Language; bundle: StoryEngineBundle } | null = null;

/** Все строки процедурного движка для текущего языка интерфейса (кэш по языку). */
export function getStoryEngineBundle(): StoryEngineBundle {
  const lang = getLanguage();
  if (_bundleCache && _bundleCache.lang === lang) {
    return _bundleCache.bundle;
  }
  const bundle = lang === 'en' ? bundleEn() : bundleRu();
  _bundleCache = { lang, bundle };
  return bundle;
}

export function formatAtmosphereLine(atmosphere: Atmosphere, lang: Language = getLanguage()): string {
  const a = atmosphere;
  const joined = a.sounds.join(lang === 'ru' ? ' и ' : ' and ');
  if (lang === 'ru') {
    return `${a.lighting.charAt(0).toUpperCase() + a.lighting.slice(1)} свет ложится на место, настроение — «${a.mood}». Слышно: ${joined}. Музыка: ${a.music}.`;
  }
  return `The ${a.lighting} light sets the mood: ${a.mood}. You hear ${joined}. Music feels ${a.music}.`;
}
