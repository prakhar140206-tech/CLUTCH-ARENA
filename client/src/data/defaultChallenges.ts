import { ClientChallenge } from '../../../shared/types.js';

export const CLIENT_FALLBACK_CHALLENGES: ClientChallenge[] = [
  {
    id: 'arr-001',
    title: 'Two Sum Pointer Matrix',
    topic: 'arrays_and_strings',
    difficulty: 'easy',
    type: 'predict_output',
    prompt: 'Given an array sorted in ascending order `nums = [2, 7, 11, 15]` and `target = 9`, what are the 0-based indices of the two numbers that add up to target?',
    codeSnippet: `function twoSum(nums, target) {
  let left = 0, right = nums.length - 1;
  while (left < right) {
    const sum = nums[left] + nums[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
    options: ['[0, 1]', '[1, 2]', '[0, 2]', '[0, 3]'],
    correctAnswer: '[0, 1]',
    explanation: 'nums[0] is 2, nums[1] is 7. 2 + 7 = 9. The two-pointer approach finds this in O(n) time and O(1) auxiliary space.',
    timeLimitSeconds: 25
  },
  {
    id: 'cmp-001',
    title: 'Merge Sort vs Quick Sort Worst Case',
    topic: 'complexity_analysis',
    difficulty: 'medium',
    type: 'mcq',
    prompt: 'What are the worst-case time complexities of Merge Sort and standard Quick Sort (with last-element pivot on already sorted array) respectively?',
    options: [
      'Merge: O(n log n), Quick: O(n²)',
      'Merge: O(n²), Quick: O(n log n)',
      'Merge: O(n log n), Quick: O(n log n)',
      'Merge: O(n), Quick: O(n²)'
    ],
    correctAnswer: 'Merge: O(n log n), Quick: O(n²)',
    explanation: 'Merge Sort always divides in half leading to O(n log n) even in worst case. Standard naive Quick Sort suffers O(n²) when the pivot produces unbalanced partitions of size 1 and n-1.',
    timeLimitSeconds: 25
  },
  {
    id: 'stk-001',
    title: 'Stack Rail: Valid Parentheses Check',
    topic: 'stacks_and_queues',
    difficulty: 'easy',
    type: 'mcq',
    prompt: 'Evaluating string `"{[()]}"` using a LIFO Stack. At the exact moment character `")"` is encountered, what is the topmost element on the stack?',
    options: ['(', '[', '{', 'None - stack is empty'],
    correctAnswer: '(',
    explanation: 'Characters "{", "[", "(" are pushed in sequence. When ")" arrives, the top is "(", which matches and gets popped.',
    timeLimitSeconds: 20
  },
  {
    id: 'arr-steps-01',
    title: 'Reconstruct Binary Search Steps',
    topic: 'searching_and_sorting',
    difficulty: 'easy',
    type: 'arrange_steps',
    prompt: 'Arrange the fundamental execution steps of Binary Search on a sorted array in the correct chronological order from top to bottom:',
    arrangeStepsData: {
      items: [
        { id: 'step-4', text: 'If target is smaller, adjust right = mid - 1; otherwise left = mid + 1' },
        { id: 'step-1', text: 'Initialize left pointer at 0 and right pointer at array.length - 1' },
        { id: 'step-3', text: 'Compare array[mid] with the target value' },
        { id: 'step-2', text: 'Calculate midpoint index: mid = Math.floor((left + right) / 2)' }
      ],
      correctOrderIds: ['step-1', 'step-2', 'step-3', 'step-4']
    },
    correctAnswer: 'step-1,step-2,step-3,step-4',
    explanation: 'Standard binary search initializes bounds, computes midpoint, checks for match, and halves search space.',
    timeLimitSeconds: 30
  },
  {
    id: 'arr-interactive-01',
    title: 'Array Partition Partitioning',
    topic: 'arrays_and_strings',
    difficulty: 'easy',
    type: 'interactive_array',
    prompt: 'Target is 5. Tap or click elements strictly greater than target 5:',
    interactiveArrayData: {
      initialArray: [2, 8, 3, 7, 5, 9, 1],
      targetDescription: 'Tap elements strictly greater than 5',
      actionType: 'select_subarray',
      validationTarget: [1, 3, 5]
    },
    correctAnswer: '[1, 3, 5]',
    explanation: 'Elements greater than 5 are 8 (index 1), 7 (index 3), and 9 (index 5).',
    timeLimitSeconds: 25
  },
  {
    id: 'fill-blank-01',
    title: 'Kadane Max Subarray Recovery',
    topic: 'dynamic_programming',
    difficulty: 'medium',
    type: 'fill_in_blank',
    prompt: 'Complete the core dynamic programming recurrence of Kadane\'s algorithm for maximum subarray sum:',
    fillBlankData: {
      template: 'currentMax = Math.max(nums[i], currentMax {{BLANK_1}} nums[i]);',
      blanks: [
        { id: 'BLANK_1', label: 'Operator (+, -, *, /)', acceptedAnswers: ['+'] }
      ]
    },
    correctAnswer: '+',
    explanation: 'Kadane either extends the existing subarray sum (currentMax + nums[i]) or starts fresh at nums[i].',
    timeLimitSeconds: 25
  },
  {
    id: 'match-01',
    title: 'Algorithm Design Paradigm Matching',
    topic: 'complexity_analysis',
    difficulty: 'hard',
    type: 'matching',
    prompt: 'Match each fundamental algorithm to its canonical algorithmic design strategy:',
    matchingData: {
      leftColumn: [
        { id: 'l1', text: 'Merge Sort' },
        { id: 'l2', text: 'Dijkstra Shortest Path' },
        { id: 'l3', text: '0/1 Knapsack' }
      ],
      rightColumn: [
        { id: 'r1', text: 'Divide and Conquer' },
        { id: 'r2', text: 'Greedy' },
        { id: 'r3', text: 'Dynamic Programming' }
      ],
      correctPairs: [
        { leftId: 'l1', rightId: 'r1' },
        { leftId: 'l2', rightId: 'r2' },
        { leftId: 'l3', rightId: 'r3' }
      ]
    },
    correctAnswer: '{"Merge Sort":"Divide and Conquer","Dijkstra Shortest Path":"Greedy","0/1 Knapsack":"Dynamic Programming"}',
    explanation: 'Merge sort divides into subproblems; Dijkstra greedily takes minimum edge; 0/1 Knapsack stores overlapping subproblem states.',
    timeLimitSeconds: 30
  },
  {
    id: 'tree-001',
    title: 'BST Inorder Traversal Property',
    topic: 'trees_and_bst',
    difficulty: 'easy',
    type: 'mcq',
    prompt: 'Performing an In-Order traversal (Left -> Root -> Right) on a valid Binary Search Tree (BST) will always visit node values in what order?',
    options: [
      'Strictly sorted ascending order',
      'Strictly sorted descending order',
      'Level-by-level breadth first order',
      'Reverse topological order'
    ],
    correctAnswer: 'Strictly sorted ascending order',
    explanation: 'By BST definition, left subtree < root < right subtree. Traversing L-Root-R outputs elements in non-decreasing sorted order.',
    timeLimitSeconds: 20
  },
  {
    id: 'graph-001',
    title: 'Cycle Detection Data Structure',
    topic: 'graphs',
    difficulty: 'hard',
    type: 'mcq',
    prompt: 'Which data structure allows detecting cycles and maintaining connected components in an undirected graph in near O(1) amortized inverse Ackermann time α(n)?',
    options: [
      'Disjoint Set Union (Union-Find) with path compression',
      'Min-Heap Priority Queue',
      'Doubly Linked List',
      'Red-Black Balanced Tree'
    ],
    correctAnswer: 'Disjoint Set Union (Union-Find) with path compression',
    explanation: 'DSU with union by rank and path compression achieves O(α(n)) amortized per operation, nearly constant time.',
    timeLimitSeconds: 25
  }
];

export const CLIENT_DIAGNOSTIC_QUESTIONS = [
  {
    id: 'diag-001',
    title: 'Array Indexing & Access Time',
    prompt: 'What is the time complexity of accessing an element in an array by its index?',
    options: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'],
    correctAnswer: 'O(1)'
  },
  {
    id: 'diag-002',
    title: 'Stack LIFO Operation',
    prompt: 'If elements [10, 20, 30] are pushed onto an empty stack in that order, which element is popped first?',
    options: ['30', '10', '20', 'Cannot be determined'],
    correctAnswer: '30'
  },
  {
    id: 'diag-003',
    title: 'Binary Search Requirement',
    prompt: 'What is the essential precondition required for applying Binary Search on a dataset?',
    options: [
      'The array must be sorted',
      'The array must have an even length',
      'Elements must be strictly positive',
      'The data structure must be a linked list'
    ],
    correctAnswer: 'The array must be sorted'
  }
];
