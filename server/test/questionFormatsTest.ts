import assert from 'assert';
import { ScoringEngine } from '../src/game/scoringEngine.js';
import { DSA_CHALLENGE_BANK, getSanitizedChallenge } from '../src/challenges/challengeBank.js';

async function runQuestionFormatsTests() {
  console.log('\n🧩 =========================================================');
  console.log('🧩 RUNNING UNIFIED QUESTION ENGINE FORMAT VALIDATOR TESTS');
  console.log('🧩 =========================================================\n');

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. MCQ
  await test('Format Validator: MCQ correctly accepts correct key and rejects incorrect key', () => {
    const mcq = DSA_CHALLENGE_BANK.find(c => c.type === 'mcq')!;
    assert.ok(mcq);

    const valid = ScoringEngine.validateAnswer(mcq, mcq.correctAnswer!);
    assert.strictEqual(valid.isCorrect, true);

    const wrong = ScoringEngine.validateAnswer(mcq, 'definitely_wrong_answer');
    assert.strictEqual(wrong.isCorrect, false);
  });

  // 2. Predict Output
  await test('Format Validator: Predict Output trims whitespace and validates correctly', () => {
    const po = DSA_CHALLENGE_BANK.find(c => c.type === 'predict_output')!;
    assert.ok(po);

    const valid = ScoringEngine.validateAnswer(po, `  ${po.correctAnswer}  \n`);
    assert.strictEqual(valid.isCorrect, true);

    const invalid = ScoringEngine.validateAnswer(po, '999');
    assert.strictEqual(invalid.isCorrect, false);
  });

  // 3. Fill-in-the-Blank
  await test('Format Validator: Fill-in-the-Blank validates blank dictionary and accepted alternatives', () => {
    const fib = DSA_CHALLENGE_BANK.find(c => c.type === 'fill_in_blank')!;
    assert.ok(fib && fib.fillBlankData);

    // Exact match for fib-001 (BLANK_1: low, BLANK_2: mid + 1)
    const valid = ScoringEngine.validateAnswer(fib, { BLANK_1: 'low', BLANK_2: 'mid + 1' });
    assert.strictEqual(valid.isCorrect, true);
    assert.strictEqual(valid.partialCreditRatio, 1.0);

    // Alternative accepted answer ('l' and 'mid+1')
    const validAlt = ScoringEngine.validateAnswer(fib, { BLANK_1: 'l', BLANK_2: 'mid+1' });
    assert.strictEqual(validAlt.isCorrect, true);

    // Incorrect answer
    const invalid = ScoringEngine.validateAnswer(fib, { BLANK_1: 'high', BLANK_2: 'mid - 1' });
    assert.strictEqual(invalid.isCorrect, false);
  });

  // 4. Matching Pairs with Partial Credit
  await test('Format Validator: Matching validates pair array and awards partial credit', () => {
    const matchCh = DSA_CHALLENGE_BANK.find(c => c.type === 'matching')!;
    assert.ok(matchCh && matchCh.matchingData);

    const correctPairs = matchCh.matchingData.correctPairs!;
    assert.ok(Array.isArray(correctPairs));

    // 100% Correct Match
    const valid = ScoringEngine.validateAnswer(matchCh, correctPairs);
    assert.strictEqual(valid.isCorrect, true);
    assert.strictEqual(valid.partialCreditRatio, 1.0);

    // Partial Credit (2 of 4 matched)
    const partialPairs = [
      correctPairs[0],
      correctPairs[1],
      { leftId: correctPairs[2].leftId, rightId: 'WRONG_PAIR' },
      { leftId: correctPairs[3].leftId, rightId: 'WRONG_PAIR_2' }
    ];

    const partialRes = ScoringEngine.validateAnswer(matchCh, partialPairs);
    assert.strictEqual(partialRes.isCorrect, false);
    assert.strictEqual(partialRes.partialCreditRatio, 0.5, '2 of 4 correct must award 0.5 partial credit ratio');
  });

  // 5. Arrange Steps Sequence
  await test('Format Validator: Arrange Steps validates strict chronological permutation', () => {
    const arrCh = DSA_CHALLENGE_BANK.find(c => c.type === 'arrange_steps')!;
    assert.ok(arrCh && arrCh.arrangeStepsData);

    const correctOrder = arrCh.arrangeStepsData.correctOrderIds!;

    // Correct permutation
    const valid = ScoringEngine.validateAnswer(arrCh, correctOrder);
    assert.strictEqual(valid.isCorrect, true);

    // Inverted permutation
    const reversed = [...correctOrder].reverse();
    const invalid = ScoringEngine.validateAnswer(arrCh, reversed);
    assert.strictEqual(invalid.isCorrect, false);
  });

  // 6. Pseudocode Tracing
  await test('Format Validator: Pseudocode Tracing validates output prediction correctly', () => {
    const pcCh = DSA_CHALLENGE_BANK.find(c => c.type === 'pseudocode')!;
    assert.ok(pcCh);

    const valid = ScoringEngine.validateAnswer(pcCh, pcCh.correctAnswer!);
    assert.strictEqual(valid.isCorrect, true);

    const wrong = ScoringEngine.validateAnswer(pcCh, '55 steps');
    assert.strictEqual(wrong.isCorrect, false);
  });

  // 7. Interactive Visual Array (Subarray Selection)
  await test('Format Validator: Interactive Array validates exact subarray indices { startIndex, endIndex }', () => {
    const iaCh = DSA_CHALLENGE_BANK.find(c => c.type === 'interactive_array')!;
    assert.ok(iaCh && iaCh.interactiveArrayData);

    const targetSubarray = iaCh.interactiveArrayData.validationTarget!;

    // Valid subarray selection
    const valid = ScoringEngine.validateAnswer(iaCh, targetSubarray);
    assert.strictEqual(valid.isCorrect, true);

    // Invalid subarray selection
    const invalid = ScoringEngine.validateAnswer(iaCh, { startIndex: 0, endIndex: 1 });
    assert.strictEqual(invalid.isCorrect, false);
  });

  // 8. Sanitization Security Check Across All Formats
  await test('Sanitization: Client-bound challenge representations never leak secret answer keys', () => {
    for (const challenge of DSA_CHALLENGE_BANK) {
      const sanitized = getSanitizedChallenge(challenge);

      // Core leaks
      assert.strictEqual(sanitized.correctAnswer, undefined, `Leaked correctAnswer on ${challenge.id}`);
      assert.strictEqual(sanitized.referenceSolution, undefined, `Leaked referenceSolution on ${challenge.id}`);

      // Matching leak check
      if (sanitized.matchingData) {
        assert.strictEqual(sanitized.matchingData.correctPairs, undefined, `Leaked matching correctPairs on ${challenge.id}`);
        assert.ok(Array.isArray(sanitized.matchingData.leftColumn));
        assert.ok(Array.isArray(sanitized.matchingData.rightColumn));
      }

      // Arrange steps leak check
      if (sanitized.arrangeStepsData) {
        assert.strictEqual(sanitized.arrangeStepsData.correctOrderIds, undefined, `Leaked correctOrderIds on ${challenge.id}`);
        assert.ok(Array.isArray(sanitized.arrangeStepsData.items));
      }

      // Fill in blank leak check
      if (sanitized.fillBlankData) {
        assert.ok(Array.isArray(sanitized.fillBlankData.blanks));
        for (const b of sanitized.fillBlankData.blanks) {
          assert.strictEqual(b.acceptedAnswers, undefined, `Leaked acceptedAnswers on ${challenge.id}`);
        }
      }

      // Interactive array leak check
      if (sanitized.interactiveArrayData) {
        assert.strictEqual(sanitized.interactiveArrayData.validationTarget, undefined, `Leaked validationTarget on ${challenge.id}`);
      }
    }
  });

  console.log(`\nResults: ${passed}/${total} tests passed.\n`);
  if (passed !== total) process.exit(1);
}

runQuestionFormatsTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
