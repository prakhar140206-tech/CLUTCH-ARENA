import assert from 'assert';
import { ScoringEngine } from '../src/game/scoringEngine.js';
import { BotEngine, BOT_PROFILES } from '../src/bots/botEngine.js';
import { DSA_CHALLENGE_BANK, getSanitizedChallenge } from '../src/challenges/challengeBank.js';
import { executeCodeInIsolatedSandbox } from '../src/execution/codeRunner.js';

async function runTestSuite() {
  console.log('🧪 ===============================================');
  console.log('🧪 STARTING DSA BATTLE ARENA TEST SUITE');
  console.log('🧪 ===============================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalCount++;
    return (async () => {
      try {
        await fn();
        console.log(`  ✅ [PASS] ${name}`);
        passedCount++;
      } catch (err: any) {
        console.error(`  ❌ [FAIL] ${name}:`, err.message);
      }
    })();
  }

  // 1. Scoring & Combo Multipliers
  await test('ScoringEngine: Correct answer awards base points + bounded speed bonus', () => {
    const ch = DSA_CHALLENGE_BANK[0];
    const res = ScoringEngine.calculateScore({
      challenge: ch,
      isCorrect: true,
      timeTakenMs: 5000,
      currentCombo: 0
    });
    assert.strictEqual(res.isCorrect, true);
    assert.ok(res.pointsAwarded >= 100);
    assert.strictEqual(res.comboMultiplier, 1.0);
    assert.ok(res.speedBonus > 0 && res.speedBonus <= 50);
  });

  await test('ScoringEngine: Combo streak scales multiplier up to 2.0x max', () => {
    const ch = DSA_CHALLENGE_BANK[0];
    const res = ScoringEngine.calculateScore({
      challenge: ch,
      isCorrect: true,
      timeTakenMs: 10000,
      currentCombo: 5 // 6th consecutive
    });
    assert.strictEqual(res.isCorrect, true);
    assert.ok(res.comboMultiplier > 1.5 && res.comboMultiplier <= 2.0);
  });

  await test('ScoringEngine: Incorrect answer awards 0 points and resets combo', () => {
    const ch = DSA_CHALLENGE_BANK[0];
    const res = ScoringEngine.calculateScore({
      challenge: ch,
      isCorrect: false,
      timeTakenMs: 5000,
      currentCombo: 4
    });
    assert.strictEqual(res.isCorrect, false);
    assert.strictEqual(res.pointsAwarded, 0);
  });

  // 2. Challenge Bank Sanitization (Hidden test case & answer protection)
  await test('ChallengeBank: Sanitized challenges strip correctAnswer and protect hidden tests', () => {
    const raw = DSA_CHALLENGE_BANK.find(c => c.type === 'code_sprint')!;
    const sanitized = getSanitizedChallenge(raw);
    
    assert.strictEqual(sanitized.correctAnswer, undefined);
    assert.strictEqual(sanitized.referenceSolution, undefined);
    
    const hiddenTc = sanitized.testCases.find((tc: any) => tc.isHidden);
    assert.ok(hiddenTc);
    assert.strictEqual(hiddenTc.expectedOutput, '*** Hidden in Match ***');
  });

  // 3. AI Bot Decision Engine
  await test('BotEngine: Generates plausible delays and valid choices based on profile', () => {
    const bot = {
      id: 'bot-1',
      username: 'Speedrunner_AI',
      isBot: true,
      botDifficulty: 'speedrunner' as const,
      isHost: false,
      isReady: true,
      score: 0,
      combo: 0,
      maxCombo: 0,
      isEliminated: false,
      loadout: { color: '', visorGlow: '', meshStyle: 'cyber_ninja' as const, trailEffect: 'electric_cyan' as const, emote: 'wave' as const }
    };
    const ch = DSA_CHALLENGE_BANK[0];
    const move = BotEngine.calculateBotMove(bot, ch, 0);

    assert.ok(move.delayMs >= 1000);
    assert.ok(move.delayMs <= ch.timeLimitSeconds * 1000);
    assert.ok(move.chosenAnswer !== undefined);
  });

  // 4. Code Execution Sandbox Runner
  await test('CodeRunner: Isolated execution validates correct Python solution', async () => {
    const codeSprint = DSA_CHALLENGE_BANK.find(c => c.id === 'code-001')!;
    const userCode = `def max_sub_array(nums):\n    max_sum = nums[0]\n    current_sum = 0\n    for x in nums:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum`;
    
    const res = await executeCodeInIsolatedSandbox('python', userCode, codeSprint.testCases || []);
    assert.strictEqual(res.allPassed, true);
    assert.strictEqual(res.overallStatus, 'ACCEPTED');
    assert.strictEqual(res.passedTests, res.totalTests);
  });

  await test('CodeRunner: Catches wrong answer gracefully without crashing server', async () => {
    const codeSprint = DSA_CHALLENGE_BANK.find(c => c.id === 'code-001')!;
    const badCode = `def max_sub_array(nums):\n    return -999999`;
    
    const res = await executeCodeInIsolatedSandbox('python', badCode, codeSprint.testCases || []);
    assert.strictEqual(res.allPassed, false);
    assert.strictEqual(res.overallStatus, 'WRONG_ANSWER');
  });

  console.log(`\n===============================================`);
  console.log(`🏁 TEST RESULTS: ${passedCount}/${totalCount} tests passed.`);
  console.log(`===============================================\n`);

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runTestSuite();
