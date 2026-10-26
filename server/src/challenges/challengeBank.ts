import { Challenge } from '../types/shared.js';

export const DSA_CHALLENGE_BANK: Challenge[] = [
  // 1. Array & Two Pointers: Two Sum Target
  {
    id: 'arr-001',
    title: 'Two Sum Pointer Matrix',
    topic: 'arrays_and_strings',
    difficulty: 'beginner',
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

  // 2. Complexity Showdown: Sorting Algorithms
  {
    id: 'cmp-001',
    title: 'Complexity Showdown: Merge Sort vs Quick Sort Worst Case',
    topic: 'complexity_analysis',
    difficulty: 'intermediate',
    type: 'complexity',
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

  // 3. Stacks & Queues: Valid Parentheses
  {
    id: 'stk-001',
    title: 'Stack Rail: Valid Parentheses Check',
    topic: 'stacks_and_queues',
    difficulty: 'beginner',
    type: 'mcq',
    prompt: 'Evaluating string `"{[()]}"` using a LIFO Stack. At the exact moment character `")"` is encountered, what is the topmost element on the stack?',
    options: ['(', '[', '{', 'None - stack is empty'],
    correctAnswer: '(',
    explanation: 'Characters "{", "[", "(" are pushed in sequence. When ")" arrives, the top is "(", which matches and gets popped.',
    timeLimitSeconds: 20
  },

  // 4. Binary Trees: Tree Traversal
  {
    id: 'tre-001',
    title: 'Cyber Tree: Inorder Traversal',
    topic: 'trees_and_bst',
    difficulty: 'intermediate',
    type: 'predict_output',
    prompt: 'Given a Binary Search Tree with Root 4, Left Child 2 (children 1, 3), Right Child 6 (children 5, 7). What is the Inorder Traversal (Left, Root, Right)?',
    codeSnippet: `//      4
//    /   \\
//   2     6
//  / \\   / \\
// 1   3 5   7`,
    options: [
      '[1, 2, 3, 4, 5, 6, 7]',
      '[4, 2, 1, 3, 6, 5, 7]',
      '[1, 3, 2, 5, 7, 6, 4]',
      '[4, 2, 6, 1, 3, 5, 7]'
    ],
    correctAnswer: '[1, 2, 3, 4, 5, 6, 7]',
    explanation: 'Inorder traversal of any valid Binary Search Tree produces values in strictly sorted ascending order: 1, 2, 3, 4, 5, 6, 7.',
    timeLimitSeconds: 25
  },

  // 5. Bug Hunter: Binary Search Edge Case
  {
    id: 'bug-001',
    title: 'Bug Hunter: Integer Overflow in Midpoint',
    topic: 'searching_and_sorting',
    difficulty: 'intermediate',
    type: 'bug_hunter',
    prompt: 'Find the critical bug in this binary search implementation in C++/Java that causes an integer overflow when `low + high > 2^31 - 1`:',
    codeSnippet: `int binarySearch(int arr[], int n, int target) {
  int low = 0, high = n - 1;
  while (low <= high) {
    int mid = (low + high) / 2; // Line 4: BUG
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
    options: [
      'Line 4: Replace (low + high) / 2 with low + (high - low) / 2',
      'Line 3: Change low <= high to low < high',
      'Line 6: Change low = mid + 1 to low = mid',
      'Line 7: Change high = mid - 1 to high = mid'
    ],
    correctAnswer: 'Line 4: Replace (low + high) / 2 with low + (high - low) / 2',
    explanation: 'In languages with fixed 32-bit signed integers, `low + high` can exceed 2,147,483,647 and overflow into negative numbers. Using `low + (high - low) / 2` avoids overflow completely.',
    timeLimitSeconds: 30
  },

  // 6. Visual Puzzle: BST Insertion Order
  {
    id: 'vis-001',
    title: 'Visual Matrix: Binary Search Tree Insertion',
    topic: 'trees_and_bst',
    difficulty: 'beginner',
    type: 'visual_puzzle',
    prompt: 'Insert value [15] into the cyber BST. Select the correct path from Root [20] to its target leaf location.',
    visualData: {
      puzzleType: 'bst_insert',
      instruction: 'Root is 20. Left child is 10. Where does 15 belong?',
      initialState: {
        root: 20,
        nodes: [
          { id: '20', val: 20, left: '10', right: '30' },
          { id: '10', val: 10, left: '5', right: null },
          { id: '30', val: 30, left: null, right: '40' },
          { id: '5', val: 5, left: null, right: null },
          { id: '40', val: 40, left: null, right: null }
        ],
        candidateToInsert: 15
      },
      targetGoal: 'right_child_of_10',
      allowedOperations: ['left_of_5', 'right_of_10', 'left_of_30', 'right_of_40']
    },
    options: ['right_of_10', 'left_of_5', 'left_of_30', 'right_of_40'],
    correctAnswer: 'right_of_10',
    explanation: '15 < 20 (go left to node 10). 15 > 10 (go right of node 10). Node 10 has no right child, so 15 becomes the right child of 10.',
    timeLimitSeconds: 25
  },

  // 7. Visual Puzzle: Linked List Pointer Reversal
  {
    id: 'vis-002',
    title: 'Visual Matrix: Linked List Pointer Flip',
    topic: 'linked_lists',
    difficulty: 'intermediate',
    type: 'visual_puzzle',
    prompt: 'You have nodes A -> B -> C. In an in-place reversal step at node B, what pointer reassignment must occur?',
    visualData: {
      puzzleType: 'linked_list_pointer',
      instruction: 'Flip B.next to point back to previous node A.',
      initialState: { nodes: ['A', 'B', 'C'] },
      targetGoal: 'B.next = A',
      allowedOperations: ['B.next = A', 'B.next = C', 'A.next = C', 'C.next = B']
    },
    options: ['B.next = A', 'B.next = C', 'A.next = C', 'C.next = null'],
    correctAnswer: 'B.next = A',
    explanation: 'To reverse the link between A and B, we save B.next in nextTemp, and assign `curr.next = prev`, which is `B.next = A`.',
    timeLimitSeconds: 20
  },

  // 8. Dynamic Programming: Fibonacci / Climbing Stairs
  {
    id: 'dp-001',
    title: 'Climbing Stairs DP Formulation',
    topic: 'dynamic_programming',
    difficulty: 'beginner',
    type: 'predict_output',
    prompt: 'You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. How many distinct ways can you climb to the top for n = 5?',
    codeSnippet: `// dp[1] = 1
// dp[2] = 2
// dp[i] = dp[i-1] + dp[i-2]`,
    options: ['8', '5', '13', '7'],
    correctAnswer: '8',
    explanation: 'dp[1]=1, dp[2]=2, dp[3]=3, dp[4]=5, dp[5]=3+5=8. This is the Fibonacci sequence shifted by one.',
    timeLimitSeconds: 25
  },

  // 9. Code Sprint: Two Sum / Subarray Sum (Real Code Execution)
  {
    id: 'code-001',
    title: 'Code Sprint: Maximum Subarray (Kadane’s Algorithm)',
    topic: 'dynamic_programming',
    difficulty: 'intermediate',
    type: 'code_sprint',
    prompt: 'Implement `maxSubArray(nums)` which finds the sum of the contiguous subarray with the largest sum. Must achieve O(n) time complexity.',
    starterCode: {
      python: `def max_sub_array(nums):\n    # Write your solution here\n    # e.g. Kadane's Algorithm\n    max_sum = nums[0]\n    current_sum = 0\n    for x in nums:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum\n`,
      javascript: `function maxSubArray(nums) {\n  let maxSum = nums[0];\n  let currentSum = 0;\n  for (let x of nums) {\n    currentSum = Math.max(x, currentSum + x);\n    maxSum = Math.max(maxSum, currentSum);\n  }\n  return maxSum;\n}`,
      cpp: `int maxSubArray(vector<int>& nums) {\n    int maxSum = nums[0], currentSum = 0;\n    for (int x : nums) {\n        currentSum = max(x, currentSum + x);\n        maxSum = max(maxSum, currentSum);\n    }\n    return maxSum;\n}`,
      java: `public int maxSubArray(int[] nums) {\n    int maxSum = nums[0], currentSum = 0;\n    for (int x : nums) {\n        currentSum = Math.max(x, currentSum + x);\n        maxSum = Math.max(maxSum, currentSum);\n    }\n    return maxSum;\n}`
    },
    testCases: [
      { id: 'tc1', input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6', isHidden: false, explanation: 'Contiguous subarray [4,-1,2,1] has the largest sum = 6.' },
      { id: 'tc2', input: '[1]', expectedOutput: '1', isHidden: false, explanation: 'Single element array.' },
      { id: 'tc3', input: '[5,4,-1,7,8]', expectedOutput: '23', isHidden: true, explanation: 'Hidden test: all elements sum to 23.' },
      { id: 'tc4', input: '[-5,-2,-8,-1]', expectedOutput: '-1', isHidden: true, explanation: 'Hidden test: all negative numbers.' }
    ],
    referenceSolution: `def max_sub_array(nums):\n    max_sum = nums[0]\n    current_sum = 0\n    for x in nums:\n        current_sum = max(x, current_sum + x)\n        max_sum = max(max_sum, current_sum)\n    return max_sum`,
    explanation: 'Kadane’s algorithm iterates through the array keeping track of the maximum sum ending at the current position. Time O(n), Space O(1).',
    timeLimitSeconds: 60
  },

  // 10. Code Sprint: Reverse String In-Place
  {
    id: 'code-002',
    title: 'Code Sprint: Valid Palindrome',
    topic: 'arrays_and_strings',
    difficulty: 'beginner',
    type: 'code_sprint',
    prompt: 'Implement `is_palindrome(s)` returning True/true if string `s` is a palindrome (ignoring casing and non-alphanumeric characters), False/false otherwise.',
    starterCode: {
      python: `def is_palindrome(s: str) -> bool:\n    filtered = [c.lower() for c in s if c.isalnum()]\n    return filtered == filtered[::-1]\n`,
      javascript: `function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}`
    },
    testCases: [
      { id: 'p1', input: '"A man, a plan, a canal: Panama"', expectedOutput: 'true', isHidden: false },
      { id: 'p2', input: '"race a car"', expectedOutput: 'false', isHidden: false },
      { id: 'p3', input: '" "', expectedOutput: 'true', isHidden: true },
      { id: 'p4', input: '"0P"', expectedOutput: 'false', isHidden: true }
    ],
    referenceSolution: `def is_palindrome(s):\n    filtered = [c.lower() for c in s if c.isalnum()]\n    return filtered == filtered[::-1]`,
    explanation: 'Filter non-alphanumeric chars, compare characters from both ends. O(n) time, O(1) space if using two pointers.',
    timeLimitSeconds: 45
  },

  // 11. Graphs: BFS Traversal Order
  {
    id: 'grp-001',
    title: 'Graph Cyber Node: Breadth-First Search Sequence',
    topic: 'graphs',
    difficulty: 'intermediate',
    type: 'predict_output',
    prompt: 'Given an undirected graph with edges (1-2), (1-3), (2-4), (3-5). Starting BFS from Node 1 (visiting neighbors in ascending order), what is the traversal order?',
    options: [
      '[1, 2, 3, 4, 5]',
      '[1, 2, 4, 3, 5]',
      '[1, 3, 2, 5, 4]',
      '[1, 5, 4, 3, 2]'
    ],
    correctAnswer: '[1, 2, 3, 4, 5]',
    explanation: 'Queue progression: [1] -> pop 1, push neighbors 2, 3 -> pop 2, push 4 -> pop 3, push 5 -> pop 4 -> pop 5. Result: 1, 2, 3, 4, 5.',
    timeLimitSeconds: 25
  },

  // 12. Heaps & Priority Queues
  {
    id: 'hp-001',
    title: 'Min-Heap Invariant Violation',
    topic: 'heaps',
    difficulty: 'intermediate',
    type: 'bug_hunter',
    prompt: 'An array representation of a binary tree is `[3, 8, 5, 12, 10, 2, 7]`. At which 0-based index is the Min-Heap property `parent <= children` violated?',
    codeSnippet: `// Indices:
// 0: 3 (left child: 8, right child: 5)
// 1: 8 (left child: 12, right child: 10)
// 2: 5 (left child: 2, right child: 7) -> ?`,
    options: [
      'Index 2 (Value 5 is greater than right/left child 2)',
      'Index 1 (Value 8 is greater than child 12)',
      'Index 0 (Value 3 is greater than child 5)',
      'No violation exists'
    ],
    correctAnswer: 'Index 2 (Value 5 is greater than right/left child 2)',
    explanation: 'The node at index 2 has value 5. Its left child is at index 2*2 + 1 = 5, which holds value 2. In a min-heap, parent must be <= child, but 5 > 2! Violation occurs at index 2.',
    timeLimitSeconds: 30
  },

  // 13. Bit Manipulation: Power of Two
  {
    id: 'bit-001',
    title: 'Bit Matrix: Power of Two Check',
    topic: 'bit_manipulation',
    difficulty: 'intermediate',
    type: 'predict_output',
    prompt: 'Which bitwise operation evaluates to 0 if and only if positive integer n is a power of 2?',
    options: [
      'n & (n - 1)',
      'n | (n - 1)',
      'n ^ (n - 1)',
      '~n & n'
    ],
    correctAnswer: 'n & (n - 1)',
    explanation: 'A power of two in binary has exactly one bit set (e.g., 8 is 1000). Subtracting 1 flips all bits after the set bit (7 is 0111). Performing bitwise AND gives 0.',
    timeLimitSeconds: 20
  },

  // 14. Sliding Window: Longest Substring Without Repeating Characters
  {
    id: 'slw-001',
    title: 'Sliding Window: Longest Substring Without Repeating Characters',
    topic: 'sliding_window',
    difficulty: 'intermediate',
    type: 'predict_output',
    prompt: 'What is the length of the longest substring without repeating characters in string `"pwwkew"`?',
    options: ['3 (wke)', '4 (wkew)', '2 (pw)', '5 (pwwke)'],
    correctAnswer: '3 (wke)',
    explanation: 'The answer is "wke", with the length of 3. Notice that "pwke" is a subsequence, not a substring.',
    timeLimitSeconds: 25
  },

  // 15. Advanced Dynamic Programming: 0/1 Knapsack
  {
    id: 'dp-adv-001',
    title: 'Advanced DP: 0/1 Knapsack State Transition',
    topic: 'dynamic_programming',
    difficulty: 'advanced',
    type: 'predict_output',
    prompt: 'Given weights `wt = [1, 2, 3]` and values `val = [10, 15, 40]`, what is the maximum value attainable with knapsack capacity `W = 3`?',
    codeSnippet: `// dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w - wt[i-1]])
// Capacities: 1, 2, 3`,
    options: ['40 (weight 3 only)', '25 (weights 1 and 2)', '55', '50'],
    correctAnswer: '40 (weight 3 only)',
    explanation: 'Weights {1, 2} give value 10 + 15 = 25. Weight {3} alone gives value 40. The maximum value for capacity 3 is 40.',
    timeLimitSeconds: 20
  },

  // 16. Advanced Graph: Dijkstra Shortest Path Invariant
  {
    id: 'grp-adv-001',
    title: 'Graph Sentinel: Dijkstra Non-Negative Weight Invariant',
    topic: 'graphs',
    difficulty: 'advanced',
    type: 'mcq',
    prompt: 'Why does Dijkstra’s greedy shortest-path algorithm fail on graphs containing negative edge weights?',
    options: [
      'It assumes once a vertex is marked visited/settled, its shortest distance cannot decrease',
      'It requires a topological sort of the vertices first',
      'It cannot detect disconnected components',
      'Its priority queue only supports minimum integers'
    ],
    correctAnswer: 'It assumes once a vertex is marked visited/settled, its shortest distance cannot decrease',
    explanation: 'Dijkstra assumes a settled node already has its minimal distance. A negative weight edge visited later could produce a shorter path to an already processed node, violating the greedy invariant. Bellman-Ford or SPFA is required instead.',
    timeLimitSeconds: 20
  },

  // 17. Advanced Data Structures: Monotonic Stack
  {
    id: 'stk-adv-001',
    title: 'Advanced Stack: Next Greater Element Monotonic Pattern',
    topic: 'stacks_and_queues',
    difficulty: 'advanced',
    type: 'predict_output',
    prompt: 'Given array `[2, 1, 5, 3]`, what is the Next Greater Element array (using a decreasing monotonic stack, where -1 denotes no greater element exists to the right)?',
    options: [
      '[5, 5, -1, -1]',
      '[5, 2, -1, -1]',
      '[1, 5, 3, -1]',
      '[5, 5, 3, -1]'
    ],
    correctAnswer: '[5, 5, -1, -1]',
    explanation: 'For 2, next greater on right is 5. For 1, next greater is 5. For 5, no greater exists (-1). For 3, no greater exists (-1). Result: [5, 5, -1, -1].',
    timeLimitSeconds: 20
  },

  // 18. Expert Level: Disjoint Set Union (DSU) Amortized Complexity
  {
    id: 'dsu-exp-001',
    title: 'Expert Complexity: Disjoint Set Union with Path Compression & Union by Rank',
    topic: 'complexity_analysis',
    difficulty: 'expert',
    type: 'complexity',
    prompt: 'What is the amortized time complexity per operation for a Disjoint Set Union (DSU) data structure implementing BOTH Path Compression AND Union by Rank for m operations across n elements?',
    options: [
      'O(α(n)) — Inverse Ackermann function (effectively constant <= 4)',
      'O(log n)',
      'O(log* n) — Iterated logarithm',
      'O(1) strict worst-case'
    ],
    correctAnswer: 'O(α(n)) — Inverse Ackermann function (effectively constant <= 4)',
    explanation: 'Combining union by rank and path compression achieves O(m · α(n)) total time for m operations, giving an amortized cost of O(α(n)) per operation, where α is the extremely slow-growing inverse Ackermann function.',
    timeLimitSeconds: 15
  },

  // 19. Expert Level: Trie Matrix Word Search
  {
    id: 'tri-exp-001',
    title: 'Expert Trie: Prefix Tree Search Traversal',
    topic: 'trees_and_bst',
    difficulty: 'expert',
    type: 'predict_output',
    prompt: 'A Trie contains keys `["app", "apple", "apply", "apt"]`. Starting from root, which branch split has the highest degree (number of distinct children branches)?',
    options: [
      'Node "p" (second letter) with children "p" and "t"',
      'Root node with children "a", "b", "c"',
      'Node "l" with children "e" and "y"',
      'Node "e" with child "s"'
    ],
    correctAnswer: 'Node "p" (second letter) with children "p" and "t"',
    explanation: 'From "ap", it branches into "app" (child "p") and "apt" (child "t"). Then from "app" it further branches to end-of-word and child "l". The fork at second letter "p" splits into "p" and "t".',
    timeLimitSeconds: 15
  }
];

export function getSanitizedChallenge(challenge: Challenge): any {
  // Strip correctAnswer and referenceSolution, and sanitize hidden test cases
  const { correctAnswer, referenceSolution, ...safeCopy } = challenge;
  if (safeCopy.testCases) {
    safeCopy.testCases = safeCopy.testCases.map(tc => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.isHidden ? '*** Hidden in Match ***' : tc.expectedOutput,
      isHidden: tc.isHidden,
      explanation: tc.isHidden ? undefined : tc.explanation
    }));
  }
  return safeCopy;
}
