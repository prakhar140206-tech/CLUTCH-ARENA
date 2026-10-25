import { Challenge, SubmissionResponse, Difficulty } from '../../../shared/types.js';

export interface ScoreCalculationInput {
  challenge: Challenge;
  isCorrect: boolean;
  timeTakenMs: number;
  currentCombo: number;
  testCaseResults?: Array<{ passed: boolean }>;
}

export class ScoringEngine {
  private static DIFFICULTY_BASE_POINTS: Record<Difficulty, number> = {
    beginner: 100,
    intermediate: 200,
    advanced: 300,
    expert: 400
  };

  /**
   * Server-authoritative score calculation.
   * Speed bonus is strictly bounded and only awarded when answer is confirmed correct.
   */
  public static calculateScore(input: ScoreCalculationInput): SubmissionResponse {
    const { challenge, isCorrect, timeTakenMs, currentCombo, testCaseResults } = input;

    if (!isCorrect) {
      return {
        success: true,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        newCombo: 0,
        auraDelta: -500,
        feedback: 'Incorrect solution. Streak reset.'
      } as any;
    }

    // 1. Base Points
    let base = this.DIFFICULTY_BASE_POINTS[challenge.difficulty] || 100;

    // Bonus for code sprint if partial test cases
    if (challenge.type === 'code_sprint' && testCaseResults && testCaseResults.length > 0) {
      const passedCount = testCaseResults.filter(t => t.passed).length;
      const ratio = passedCount / testCaseResults.length;
      base = Math.round(base * ratio);
    }

    // 2. Combo multiplier: +15% per streak, capped at 2.0x (7+ streak)
    const newCombo = currentCombo + 1;
    const comboMultiplier = Math.min(2.0, 1.0 + (newCombo - 1) * 0.15);

    // 3. Bounded Speed Bonus: up to 50 max points based on remaining time
    const totalTimeMs = challenge.timeLimitSeconds * 1000;
    const remainingMs = Math.max(0, totalTimeMs - timeTakenMs);
    const speedRatio = Math.min(1.0, remainingMs / totalTimeMs);
    const speedBonus = Math.round(speedRatio * 50);

    // 4. Total Points for this challenge
    const pointsAwarded = Math.round(base * comboMultiplier) + speedBonus;
    const auraDelta = 1000 + Math.round(speedBonus * 25) + (newCombo * 350);

    return {
      success: true,
      isCorrect: true,
      pointsAwarded,
      speedBonus,
      comboMultiplier: Number(comboMultiplier.toFixed(2)),
      totalScore: pointsAwarded,
      auraDelta,
      feedback: `Correct! +${pointsAwarded} pts (Combo x${comboMultiplier.toFixed(2)}, Speed +${speedBonus}, Aura +${auraDelta})`
    };
  }
}

