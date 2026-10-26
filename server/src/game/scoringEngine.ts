import { Challenge, SubmissionResponse, Difficulty } from '../types/shared.js';

export interface ScoreCalculationInput {
  challenge: Challenge;
  isCorrect: boolean;
  timeTakenMs: number;
  currentCombo: number;
  partialCreditRatio?: number;
  testCaseResults?: Array<{ passed: boolean }>;
}

export class ScoringEngine {
  // Base points configured at 100 points as specified in Section 11
  private static BASE_POINTS = 100;

  /**
   * Server-authoritative answer validator supporting all 9 question formats.
   */
  public static validateAnswer(challenge: Challenge, answer: any): { isCorrect: boolean; partialCreditRatio: number; feedback: string } {
    if (answer === null || answer === undefined || answer === '') {
      return { isCorrect: false, partialCreditRatio: 0, feedback: 'No answer submitted or skipped.' };
    }

    // 1. Matching Questions
    if (challenge.type === 'matching') {
      const correctPairs: Array<{ leftId: string; rightId: string }> = 
        challenge.matchingData?.correctPairs || challenge.correctAnswer || [];
      if (!Array.isArray(answer) || correctPairs.length === 0) {
        return { isCorrect: false, partialCreditRatio: 0, feedback: 'Invalid matching answer format.' };
      }

      let matched = 0;
      for (const pair of correctPairs) {
        const found = answer.some(
          (a: any) => String(a.leftId).trim() === String(pair.leftId).trim() &&
                     String(a.rightId).trim() === String(pair.rightId).trim()
        );
        if (found) matched++;
      }

      const ratio = matched / correctPairs.length;
      const isCorrect = ratio === 1.0;
      return {
        isCorrect,
        partialCreditRatio: ratio,
        feedback: isCorrect 
          ? 'All pairs matched correctly!' 
          : `Matched ${matched} of ${correctPairs.length} pairs correctly.`
      };
    }

    // 2. Arrange Steps
    if (challenge.type === 'arrange_steps') {
      const correctOrder: string[] = challenge.arrangeStepsData?.correctOrderIds || challenge.correctAnswer || [];
      if (!Array.isArray(answer) || correctOrder.length === 0) {
        return { isCorrect: false, partialCreditRatio: 0, feedback: 'Invalid step order format.' };
      }

      const isCorrect = answer.length === correctOrder.length &&
        answer.every((val: any, idx: number) => String(val).trim() === String(correctOrder[idx]).trim());

      return {
        isCorrect,
        partialCreditRatio: isCorrect ? 1.0 : 0.0,
        feedback: isCorrect ? 'Steps arranged in the correct order!' : 'Incorrect step sequence.'
      };
    }

    // 3. Fill In The Blank
    if (challenge.type === 'fill_in_blank') {
      const blanks = challenge.fillBlankData?.blanks || [];
      const expectedMap = challenge.correctAnswer || {};
      if (typeof answer !== 'object' || blanks.length === 0) {
        return { isCorrect: false, partialCreditRatio: 0, feedback: 'Invalid fill-in-the-blank submission.' };
      }

      let correctCount = 0;
      for (const b of blanks) {
        const userVal = String(answer[b.id] || '').trim().toLowerCase();
        const accepted = (b.acceptedAnswers || [expectedMap[b.id]]).map(a => String(a).trim().toLowerCase());
        if (accepted.includes(userVal)) {
          correctCount++;
        }
      }

      const ratio = correctCount / blanks.length;
      const isCorrect = ratio === 1.0;
      return {
        isCorrect,
        partialCreditRatio: ratio,
        feedback: isCorrect ? 'All blanks filled correctly!' : `Filled ${correctCount} of ${blanks.length} blanks correctly.`
      };
    }

    // 4. Interactive Array & Matrix
    if (challenge.type === 'interactive_array') {
      const target = challenge.interactiveArrayData?.validationTarget || challenge.correctAnswer;
      if (!target) {
        return { isCorrect: false, partialCreditRatio: 0, feedback: 'Missing target validation data.' };
      }

      // Check subarray selection
      if (target.startIndex !== undefined && target.endIndex !== undefined) {
        const isCorrect = Number(answer.startIndex) === Number(target.startIndex) &&
                          Number(answer.endIndex) === Number(target.endIndex);
        return {
          isCorrect,
          partialCreditRatio: isCorrect ? 1.0 : 0.0,
          feedback: isCorrect ? 'Subarray correctly targeted!' : 'Incorrect subarray boundaries selected.'
        };
      }

      // Check general object equality
      const isCorrect = JSON.stringify(answer) === JSON.stringify(target);
      return {
        isCorrect,
        partialCreditRatio: isCorrect ? 1.0 : 0.0,
        feedback: isCorrect ? 'Visual state correctly manipulated!' : 'Target state not reached.'
      };
    }

    // 5. MCQs, Predict Output, Bug Hunter, Complexity, Pseudocode, Visual Puzzle
    const expected = String(challenge.correctAnswer).trim().toLowerCase();
    const cleanAnswer = String(answer).trim().toLowerCase();
    const isCorrect = expected === cleanAnswer;

    return {
      isCorrect,
      partialCreditRatio: isCorrect ? 1.0 : 0.0,
      feedback: isCorrect ? 'Correct!' : 'Incorrect answer.'
    };
  }

  /**
   * Server-authoritative competitive score calculation.
   * - Correct answer: 100 base points.
   * - Speed bonus: up to 50 additional points.
   * - Incorrect answer / timeout / skip: 0 points.
   */
  public static calculateScore(input: ScoreCalculationInput): SubmissionResponse {
    const { challenge, isCorrect, timeTakenMs, currentCombo, partialCreditRatio, testCaseResults } = input;

    // Authoritative per-question timer check: submissions beyond limit + 2s grace are timed out
    const totalTimeMs = (challenge.timeLimitSeconds || 20) * 1000;
    const isTimedOut = timeTakenMs > totalTimeMs + 2000;

    if (isTimedOut) {
      return {
        success: true,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        auraDelta: -500,
        feedback: 'Submission rejected: Time limit expired (Timeout).'
      };
    }

    if (!isCorrect && (!partialCreditRatio || partialCreditRatio === 0)) {
      return {
        success: true,
        isCorrect: false,
        pointsAwarded: 0,
        speedBonus: 0,
        comboMultiplier: 1.0,
        totalScore: 0,
        auraDelta: -500,
        feedback: 'Incorrect solution. Streak reset.'
      };
    }

    // 1. Base Points: 100 base points (or scaled by partial credit)
    const credit = partialCreditRatio !== undefined ? partialCreditRatio : (isCorrect ? 1.0 : 0.0);
    let base = Math.round(this.BASE_POINTS * credit);

    // Scaling for code sprint if test cases present
    if (challenge.type === 'code_sprint' && testCaseResults && testCaseResults.length > 0) {
      const passedCount = testCaseResults.filter(t => t.passed).length;
      const ratio = passedCount / testCaseResults.length;
      base = Math.round(this.BASE_POINTS * ratio);
    }

    // 2. Combo multiplier: +15% per streak, capped at 2.0x
    const newCombo = isCorrect ? currentCombo + 1 : 0;
    const comboMultiplier = isCorrect ? Math.min(2.0, 1.0 + Math.max(0, newCombo - 1) * 0.15) : 1.0;

    // 3. Bounded Speed Bonus: up to 50 points based on elapsed time vs limit
    const remainingMs = Math.max(0, totalTimeMs - timeTakenMs);
    const speedRatio = Math.min(1.0, remainingMs / totalTimeMs);
    const speedBonus = isCorrect ? Math.round(speedRatio * 50) : 0;

    // 4. Total points awarded
    const pointsAwarded = Math.round(base * comboMultiplier) + speedBonus;
    const auraDelta = isCorrect ? (1000 + Math.round(speedBonus * 25) + (newCombo * 350)) : 0;

    return {
      success: true,
      isCorrect: credit >= 1.0,
      partialCreditRatio: credit,
      pointsAwarded,
      speedBonus,
      comboMultiplier: Number(comboMultiplier.toFixed(2)),
      totalScore: pointsAwarded,
      auraDelta,
      feedback: isCorrect 
        ? `Correct! +${pointsAwarded} pts (Combo x${comboMultiplier.toFixed(2)}, Speed +${speedBonus})`
        : `Partial credit: +${pointsAwarded} pts (${Math.round(credit * 100)}%)`
    };
  }
}
