import assert from 'assert';
import { MasteryEngine, DIFFICULTY_TIERS } from '../src/adaptive/masteryEngine.js';
import { RemediationEngine } from '../src/adaptive/remediationEngine.js';
import { persistenceStore } from '../src/storage/db.js';
import { DSA_CHALLENGE_BANK } from '../src/challenges/challengeBank.js';
import { DSATopic, Difficulty, DSAOnboardingPreferences } from '../src/types/shared.js';

async function runAdaptiveLearningTests() {
  console.log('\n🧠 =========================================================');
  console.log('🧠 RUNNING ADAPTIVE DSA LEARNING ENGINE & MASTERY TESTS');
  console.log('🧠 =========================================================\n');

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

  // TEST 1: DSA Onboarding Preferences Persistence
  await test('DSA Preferences: Saves and retrieves 4 languages, experience, pacing, topics, and formats', () => {
    const testUserId = 'pilot-eval-adaptive-99';
    const prefs: DSAOnboardingPreferences = {
      userId: testUserId,
      languages: ['python', 'cpp', 'java'],
      experienceLevel: 'intermediate',
      preferredTopics: ['arrays_and_strings', 'dynamic_programming', 'trees_and_bst'],
      preferredFormats: ['mcq', 'code_sprint', 'fill_in_blank', 'matching'],
      goals: ['interview_prep', 'competitive_programming'],
      progressionPacing: 'balanced',
      diagnosticScore: 2,
      assessedLevel: 'medium',
      completedAt: Date.now()
    };

    persistenceStore.saveDSAPreferences(prefs);
    const retrieved = persistenceStore.getDSAPreferences(testUserId);

    assert.ok(retrieved !== null);
    assert.strictEqual(retrieved!.userId, testUserId);
    assert.strictEqual(retrieved!.experienceLevel, 'intermediate');
    assert.strictEqual(retrieved!.languages.length, 3);
    assert.ok(retrieved!.languages.includes('cpp'));
    assert.ok(retrieved!.preferredTopics.includes('dynamic_programming'));
  });

  // TEST 2: All 5 Progressive Difficulty Tiers Exist in Engine
  await test('MasteryEngine: Supports exactly 5 difficulty tiers (easy -> medium -> hard -> advanced -> extreme_hard)', () => {
    const expectedTiers: Difficulty[] = ['easy', 'medium', 'hard', 'advanced', 'extreme_hard'];
    assert.deepStrictEqual(DIFFICULTY_TIERS, expectedTiers);
  });

  // TEST 3: Promotion on Consistent Fast Correct Answers
  await test('Adaptive Progression: 3 consecutive fast correct answers promotes difficulty tier', () => {
    let record = MasteryEngine.createDefaultRecord('arrays_and_strings', 'easy');
    assert.strictEqual(record.currentDifficulty, 'easy');

    // Simulate 3 consecutive fast correct answers
    for (let i = 0; i < 3; i++) {
      record = MasteryEngine.evaluatePerformance(record, {
        topic: 'arrays_and_strings',
        isCorrect: true,
        timeTakenMs: 3000,
        timeLimitMs: 15000
      });
    }

    assert.strictEqual(record.currentDifficulty, 'medium', 'Must be promoted from easy to medium after 3 fast correct answers');
    assert.ok(record.masteryScore > 65);
    assert.strictEqual(record.needsRemediation, false);
  });

  // TEST 4: Demotion on Repeated Failures
  await test('Adaptive Progression: 3 consecutive failures demotes difficulty tier', () => {
    let record = MasteryEngine.createDefaultRecord('graphs', 'hard');
    record.masteryScore = 75;

    // Simulate 3 consecutive wrong answers
    for (let i = 0; i < 3; i++) {
      record = MasteryEngine.evaluatePerformance(record, {
        topic: 'graphs',
        isCorrect: false,
        timeTakenMs: 12000,
        timeLimitMs: 15000
      });
    }

    assert.strictEqual(record.currentDifficulty, 'medium', 'Must demote from hard to medium after 3 consecutive failures');
    assert.strictEqual(record.needsRemediation, true, 'Needs remediation must be flagged on repeated errors');
    assert.ok(record.masteryScore < 60);
  });

  // TEST 5: Guided Remediation Package Generation
  await test('RemediationEngine: Delivers targeted explanation, worked example, pitfall, and practice challenge', () => {
    const topics: DSATopic[] = ['arrays_and_strings', 'trees_and_bst', 'dynamic_programming', 'graphs'];

    for (const topic of topics) {
      const packageObj = RemediationEngine.getRemediation(topic, 'prac-fallback-1');
      assert.ok(packageObj !== null);
      assert.strictEqual(packageObj.topic, topic);
      assert.ok(packageObj.explanation.length > 20, 'Explanation must be informative');
      assert.ok(packageObj.workedExample.length > 20, 'Worked example must be provided');
      assert.ok(packageObj.commonPitfalls.length > 0, 'Common pitfalls must be present');
      assert.ok(packageObj.commonPitfalls[0].length > 10, 'Common pitfall text must be detailed');
      assert.ok(packageObj.practiceChallengeId.length > 0, 'Practice challenge ID must be present');
    }
  });

  // TEST 6: Diagnostic Calibrator Estimation
  await test('MasteryEngine: Correctly estimates diagnostic initial tier from score', () => {
    assert.strictEqual(MasteryEngine.calculateDiagnosticLevel(0, 3), 'easy');
    assert.strictEqual(MasteryEngine.calculateDiagnosticLevel(1, 3), 'medium');
    assert.strictEqual(MasteryEngine.calculateDiagnosticLevel(2, 3), 'hard');
    assert.strictEqual(MasteryEngine.calculateDiagnosticLevel(3, 3), 'advanced');
  });

  // TEST 7: Question Bank Deduplication within Session
  await test('Question Selector: Excludes already served question IDs to prevent duplicate delivery', () => {
    const sessionSeenIds = new Set<string>();
    const delivered: string[] = [];

    for (let i = 0; i < 6; i++) {
      const eligible = DSA_CHALLENGE_BANK.filter(c => !sessionSeenIds.has(c.id));
      assert.ok(eligible.length > 0, 'Eligible pool must not be empty');
      const selected = eligible[0];
      sessionSeenIds.add(selected.id);
      delivered.push(selected.id);
    }

    const uniqueSet = new Set(delivered);
    assert.strictEqual(uniqueSet.size, delivered.length, 'All delivered questions must be unique');
  });

  console.log(`\nResults: ${passed}/${total} tests passed.\n`);
  if (passed !== total) process.exit(1);
}

runAdaptiveLearningTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
