import { Difficulty, DSATopic, ConceptMasteryRecord } from '../types/shared.js';

export const DIFFICULTY_TIERS: Difficulty[] = ['easy', 'medium', 'hard', 'advanced', 'extreme_hard'];

export interface PerformanceInput {
  topic: DSATopic;
  isCorrect: boolean;
  timeTakenMs: number;
  timeLimitMs: number;
  hintsUsed?: number;
}

export class MasteryEngine {
  /**
   * Initializes a default mastery record for a topic
   */
  public static createDefaultRecord(topic: DSATopic, initialLevel: Difficulty = 'easy'): ConceptMasteryRecord {
    return {
      topic,
      masteryScore: 50,
      currentDifficulty: initialLevel,
      questionsAttempted: 0,
      questionsSolved: 0,
      recentAccuracy: 0,
      averageResponseTimeMs: 0,
      consecutiveCorrect: 0,
      consecutiveWrong: 0,
      needsRemediation: false,
      lastUpdated: Date.now()
    };
  }

  /**
   * Updates concept mastery using continuous evidence.
   * Speed alone is not treated as mastery.
   * Consistent correctness with reasonable response time triggers promotion.
   * Repeated errors trigger targeted remediation.
   */
  public static evaluatePerformance(
    current: ConceptMasteryRecord,
    input: PerformanceInput
  ): ConceptMasteryRecord {
    const attempted = current.questionsAttempted + 1;
    const solved = input.isCorrect ? current.questionsSolved + 1 : current.questionsSolved;
    
    // Weighted rolling accuracy (last 10 interactions smoothed)
    const accuracyDelta = input.isCorrect ? 100 : 0;
    const recentAccuracy = current.questionsAttempted === 0
      ? accuracyDelta
      : Math.round(current.recentAccuracy * 0.7 + accuracyDelta * 0.3);

    // Rolling average response time
    const avgTime = current.questionsAttempted === 0
      ? input.timeTakenMs
      : Math.round(current.averageResponseTimeMs * 0.7 + input.timeTakenMs * 0.3);

    let consecutiveCorrect = input.isCorrect ? current.consecutiveCorrect + 1 : 0;
    let consecutiveWrong = input.isCorrect ? 0 : current.consecutiveWrong + 1;

    // Time efficiency factor (0.5 to 1.0)
    const timeRatio = Math.min(1.0, Math.max(0.2, input.timeTakenMs / input.timeLimitMs));
    const speedFactor = input.isCorrect ? (1.0 - timeRatio * 0.4) : 0.5;

    // Score change
    let scoreDelta = 0;
    if (input.isCorrect) {
      // Base gain + speed multiplier
      scoreDelta = Math.round(8 * speedFactor);
      if (input.hintsUsed && input.hintsUsed > 0) {
        scoreDelta = Math.max(2, scoreDelta - input.hintsUsed * 2);
      }
    } else {
      // Loss depends on consecutive errors
      scoreDelta = -(6 + Math.min(6, consecutiveWrong * 2));
    }

    const newMasteryScore = Math.max(5, Math.min(100, current.masteryScore + scoreDelta));

    // Determine difficulty progression
    const currentTierIdx = DIFFICULTY_TIERS.indexOf(current.currentDifficulty);
    let newTier = current.currentDifficulty;
    let needsRemediation = false;

    if (input.isCorrect) {
      // Promotion condition: 3 consecutive correct with good accuracy and score > 70
      if (consecutiveCorrect >= 3 && newMasteryScore >= 70 && currentTierIdx < DIFFICULTY_TIERS.length - 1) {
        newTier = DIFFICULTY_TIERS[currentTierIdx + 1];
        consecutiveCorrect = 0; // Reset streak upon tier promotion
      }
    } else {
      // Repeated incorrect answers: 2 consecutive failures triggers remediation
      if (consecutiveWrong >= 2) {
        needsRemediation = true;
        // If 3 consecutive failures, demote difficulty if above easy
        if (consecutiveWrong >= 3 && currentTierIdx > 0) {
          newTier = DIFFICULTY_TIERS[currentTierIdx - 1];
        }
      }
    }

    return {
      topic: current.topic,
      masteryScore: newMasteryScore,
      currentDifficulty: newTier,
      questionsAttempted: attempted,
      questionsSolved: solved,
      recentAccuracy,
      averageResponseTimeMs: avgTime,
      consecutiveCorrect,
      consecutiveWrong,
      needsRemediation,
      remediationStep: needsRemediation ? current.remediationStep : undefined,
      lastUpdated: Date.now()
    };
  }

  /**
   * Estimates initial level based on diagnostic assessment test results
   */
  public static calculateDiagnosticLevel(score: number, maxScore: number): Difficulty {
    const ratio = maxScore > 0 ? score / maxScore : 0;
    if (ratio >= 0.85) return 'advanced';
    if (ratio >= 0.60) return 'hard';
    if (ratio >= 0.30) return 'medium';
    return 'easy';
  }
}
