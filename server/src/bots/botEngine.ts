import { Participant, Challenge } from '../../../shared/types.js';

export interface BotConfig {
  name: string;
  difficulty: 'beginner' | 'balanced' | 'speedrunner' | 'strategist' | 'advanced' | 'adaptive';
  accuracyRate: number; // 0.0 - 1.0
  minReactionSeconds: number;
  maxReactionSeconds: number;
  avatarColor: string;
  visorGlow: string;
}

export const BOT_PROFILES: Record<string, BotConfig> = {
  beginner: {
    name: 'ByteNovice_AI',
    difficulty: 'beginner',
    accuracyRate: 0.55,
    minReactionSeconds: 12,
    maxReactionSeconds: 18,
    avatarColor: '#10B981',
    visorGlow: '#34D399'
  },
  balanced: {
    name: 'AlgoSpark_AI',
    difficulty: 'balanced',
    accuracyRate: 0.75,
    minReactionSeconds: 8,
    maxReactionSeconds: 13,
    avatarColor: '#3B82F6',
    visorGlow: '#60A5FA'
  },
  speedrunner: {
    name: 'FlashBinary_AI',
    difficulty: 'speedrunner',
    accuracyRate: 0.80,
    minReactionSeconds: 3,
    maxReactionSeconds: 6,
    avatarColor: '#F59E0B',
    visorGlow: '#FBBF24'
  },
  strategist: {
    name: 'BigO_Sage_AI',
    difficulty: 'strategist',
    accuracyRate: 0.88,
    minReactionSeconds: 7,
    maxReactionSeconds: 11,
    avatarColor: '#8B5CF6',
    visorGlow: '#A78BFA'
  },
  advanced: {
    name: 'QuantumTuring_AI',
    difficulty: 'advanced',
    accuracyRate: 0.95,
    minReactionSeconds: 4,
    maxReactionSeconds: 7,
    avatarColor: '#EC4899',
    visorGlow: '#F472B6'
  },
  adaptive: {
    name: 'NexusAdaptive_AI',
    difficulty: 'adaptive',
    accuracyRate: 0.82,
    minReactionSeconds: 5,
    maxReactionSeconds: 9,
    avatarColor: '#06B6D4',
    visorGlow: '#22D3EE'
  }
};

export class BotEngine {
  /**
   * Generates a simulated response time and answer choice based on the bot's skill profile.
   * Bots use the actual question data and choose either the correct answer or a distractor.
   */
  public static calculateBotMove(
    bot: Participant,
    challenge: Challenge,
    humanLeaderScore: number = 0
  ): { delayMs: number; chosenAnswer: any } {
    const profile = BOT_PROFILES[bot.botDifficulty || 'balanced'] || BOT_PROFILES.balanced;
    
    // Calculate reaction time with a bell-curve spread
    let reactionSec = profile.minReactionSeconds + Math.random() * (profile.maxReactionSeconds - profile.minReactionSeconds);
    
    // Adaptive logic: if trailing behind human leader, speed up slightly
    if (bot.botDifficulty === 'adaptive' && bot.score < humanLeaderScore) {
      reactionSec = Math.max(3, reactionSec - 2.5);
    }

    // Ensure reaction time doesn't exceed challenge time limit
    reactionSec = Math.min(reactionSec, Math.max(2, challenge.timeLimitSeconds - 2));
    const delayMs = Math.floor(reactionSec * 1000);

    // Determine accuracy roll
    let effectiveAccuracy = profile.accuracyRate;
    if (bot.botDifficulty === 'adaptive') {
      if (bot.score > humanLeaderScore + 300) effectiveAccuracy -= 0.15; // give player a chance to catch up
      else if (bot.score < humanLeaderScore - 200) effectiveAccuracy += 0.15; // push player
    }

    const roll = Math.random();
    const willBeCorrect = roll <= effectiveAccuracy;

    let chosenAnswer: any;

    if (challenge.type === 'code_sprint') {
      // For coding sprint, if correct, use reference solution; otherwise flawed snippet
      chosenAnswer = willBeCorrect ? challenge.referenceSolution : `def broken(): return -999`;
    } else if (challenge.options && challenge.options.length > 0) {
      if (willBeCorrect) {
        chosenAnswer = challenge.correctAnswer;
      } else {
        // Pick an incorrect option
        const distractors = challenge.options.filter(opt => opt !== challenge.correctAnswer);
        chosenAnswer = distractors[Math.floor(Math.random() * distractors.length)] || challenge.options[0];
      }
    } else {
      chosenAnswer = willBeCorrect ? challenge.correctAnswer : 'incorrect_mock';
    }

    return { delayMs, chosenAnswer };
  }
}
