/**
 * @module engine.reactionEngine
 * Client reaction logic, dialogues, tip mechanics, and expression sequence timings.
 */

import type { ClientType, ClientExpression, ReactionTier } from '../types/game.types';

/**
 * Maps evaluation accuracy and outcome to a reaction tier.
 */
export function computeReactionTier(accuracy: number, passed: boolean): ReactionTier {
  if (!passed) {
    return accuracy < 50 ? 'terrible' : 'poor';
  }

  if (accuracy >= 100) return 'perfect';
  if (accuracy >= 90) return 'excellent';
  if (accuracy >= 80) return 'good';
  return 'okay';
}

/**
 * Dialogue pools by ClientType and ReactionTier.
 */
export const REACTION_DIALOGUES: Record<ClientType, Record<ReactionTier, string[]>> = {
  villager: {
    terrible: [
      'This potion is a complete disaster!',
      'My skin is turning blue! What is this?!',
      'This smells like rotten cabbage!'
    ],
    poor: [
      "It's... not quite what I asked for.",
      "I don't think this will work at all.",
      'The color is off. Are you even trying?'
    ],
    okay: [
      'Well, it looks acceptable.',
      'This should do the job, thank you.',
      "It's usable. Not perfect, but usable."
    ],
    good: [
      'Excellent! Just what I needed.',
      'You really know your colors!',
      'A fine potion. Much appreciated!'
    ],
    excellent: [
      'Oh, this is marvelous! Perfect for my needs!',
      'Wow! Best potion shop in town!',
      'Outstanding! I will tell the whole village!'
    ],
    perfect: [
      'By the heavens, this is absolute perfection!',
      'This is a work of pure art!',
      'Incredible! The color is stunning!'
    ]
  },
  wizard: {
    terrible: [
      'A complete magical catastrophe! Begone!',
      'My arcane focus has shattered!',
      'This sludge has corrupted my mana channel!'
    ],
    poor: [
      'The resonance is misaligned. A poor attempt.',
      'This needs more magical stability.',
      'A weak formulation. My spells will fizzle.'
    ],
    okay: [
      'Adequate stabilization. It will suffice.',
      'A functional brew. Nothing grand.',
      'Average magical concentration.'
    ],
    good: [
      'Ah, the light bounces beautifully off this color.',
      'Very well mixed! The mana is stable.',
      'Quite impressive. The elements align.'
    ],
    excellent: [
      "Spectacular! This is a grand master's blend!",
      'An extraordinary brew! The alignment is immaculate!',
      'The color vibration is exceptionally strong!'
    ],
    perfect: [
      'Behold, the ultimate elixir! Simply sublime!',
      'I have never seen such color precision in my centuries!',
      'A legendary mixture! Pure arcane excellence!'
    ]
  },
  zombie: {
    terrible: [
      'BLAAARGH! BAD JUICE!',
      'GRAAAHH! TASTE LIKE DIRT!',
      'ME SMASH VIAL!'
    ],
    poor: [
      'Urgh... stomach hurt.',
      'Brain want color... not this...',
      'No like. Muddy.'
    ],
    okay: [
      'Hmm, smell okay.',
      'Ugh, good enough to drink.',
      'Not bad juice.'
    ],
    good: [
      'Yum! Color nice and sweet!',
      'Me like! Good batch!',
      'Good color! Taste funny but good.'
    ],
    excellent: [
      'GRAA! ME LOVE COLOR! SO PRETTY!',
      'Tasty color! Me feel happy!',
      'Brain feel smart now! Good mix!'
    ],
    perfect: [
      'OM NOM NOM! BEST POTION EVER! GRAAAA!!',
      'PERFECT JUICE! ME SO HAPPY!',
      'ME NO EAT YOUR BRAINS TODAY! THIS BETTER!'
    ]
  },
  noble: {
    terrible: [
      'Preposterous! I demand a refund immediately!',
      'How dare you present this sludge to me?!',
      'My reputation is ruined if I carry this garbage!'
    ],
    poor: [
      'Quite disappointing. My standard is much higher.',
      'Is this a joke? Try harder next time.',
      'Highly unsatisfactory. I expect better.'
    ],
    okay: [
      'Hmm. It is acceptable, but barely.',
      'It will do, though it lacks sophistication.',
      'Adequate. But I am not impressed.'
    ],
    good: [
      'Very respectable work. My compliments.',
      'An elegant mix. You have potential.',
      'Quite pleasing. This matches my attire.'
    ],
    excellent: [
      'Magnificent! A brew worthy of my high standing!',
      'Stunning! Absolutely premium quality!',
      'A grand success. You shall be rewarded.'
    ],
    perfect: [
      'Incredible! A masterpiece fit for royalty!',
      'Exquisite! Simply flawless craft!',
      'Superb! I shall recommend you to the King!'
    ]
  },
  mystic: {
    terrible: [
      'I sense a deep darkness in this brew. It is corrupted.',
      'The third eye sees nothing but failure.',
      'The spiritual frequency is completely severed.'
    ],
    poor: [
      'The aura of this fluid is weak. A shadow of what it should be.',
      'I feel a mismatch in the cosmic flow.',
      'The vibrations are erratic and discordant.'
    ],
    okay: [
      'The energy is aligned. It will serve its purpose.',
      'I sense a quiet harmony here.',
      'A neutral energy field.'
    ],
    good: [
      'A strong, vibrant vibration! Very well mixed.',
      'The third eye glows with approval.',
      'The energy of this color is in alignment.'
    ],
    excellent: [
      'Marvelous! The cosmic frequencies are in perfect unison!',
      'An enlightened creation! I sense pure magic!',
      'The spiritual aura of this brew is radiating!'
    ],
    perfect: [
      'Ascended! This color resonates with the universe itself!',
      'Astral perfection! A potion of true enlightenment!',
      'You have touched the divine palette! Sublime!'
    ]
  }
};

/**
 * Returns a random dialogue line for the specified client type and reaction tier.
 */
export function generateReactionDialogue(clientType: ClientType, tier: ReactionTier): string {
  const lines = REACTION_DIALOGUES[clientType]?.[tier] || ['...'];
  const randomIndex = Math.floor(Math.random() * lines.length);
  return lines[randomIndex];
}

export type TipReward =
  | { type: 'score'; amount: number }
  | { type: 'token'; token: 'skip' | 'hint' | 'autoCorrect' };

/**
 * Evaluates tip reward based on reaction tier.
 * - Excellent: 30% chance of +10 score.
 * - Perfect: 100% chance of random power-up token.
 */
export function computeTipReward(tier: ReactionTier): TipReward | null {
  if (tier === 'excellent') {
    if (Math.random() < 0.3) {
      return { type: 'score', amount: 10 };
    }
  } else if (tier === 'perfect') {
    const tokens: ('skip' | 'hint' | 'autoCorrect')[] = ['skip', 'hint', 'autoCorrect'];
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    return { type: 'token', token: randomToken };
  }
  return null;
}

/**
 * Keyframe progression of expressions for each reaction tier.
 * Sequence plays in order (e.g., neutral -> happy -> ecstatic).
 */
export const TIER_EXPRESSION_SEQUENCE: Record<ReactionTier, ClientExpression[]> = {
  terrible: ['neutral', 'annoyed', 'enraged'],
  poor: ['neutral', 'annoyed'],
  okay: ['neutral', 'happy'],
  good: ['neutral', 'happy'],
  excellent: ['neutral', 'happy', 'ecstatic'],
  perfect: ['neutral', 'happy', 'surprised']
};
