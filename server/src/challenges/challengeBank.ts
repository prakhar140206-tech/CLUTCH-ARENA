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
  },

  // 20. Fill In The Blank: Binary Search Boundary Invariant (Easy)
  {
    id: 'fib-001',
    title: 'Fill-In-Blank: Binary Search Boundary Update',
    topic: 'searching_and_sorting',
    difficulty: 'easy',
    type: 'fill_in_blank',
    prompt: 'Fill in the blanks to complete the standard ascending Binary Search algorithm when target is greater than mid value.',
    codeSnippet: `int binary_search(int arr[], int n, int target) {
  int low = 0, high = n - 1;
  while (low <= high) {
    int mid = low + (high - low) / 2;
    if (arr[mid] == target) return mid;
    else if (arr[mid] < target) {
      {{BLANK_1}} = {{BLANK_2}};
    } else {
      high = mid - 1;
    }
  }
  return -1;
}`,
    fillBlankData: {
      template: '{{BLANK_1}} = {{BLANK_2}}',
      blanks: [
        { id: 'BLANK_1', label: 'Left pointer', hint: 'Variable to advance', acceptedAnswers: ['low', 'l'] },
        { id: 'BLANK_2', label: 'New boundary', hint: 'Value after mid', acceptedAnswers: ['mid + 1', 'mid+1'] }
      ]
    },
    correctAnswer: { BLANK_1: 'low', BLANK_2: 'mid + 1' },
    explanation: 'When arr[mid] < target, the target must reside strictly in the right half, so low is updated to mid + 1.',
    timeLimitSeconds: 20,
    provenance: 'verified_bank'
  },

  // 21. Fill In The Blank: Reverse Linked List (Medium)
  {
    id: 'fib-002',
    title: 'Fill-In-Blank: Linked List In-Place Reversal',
    topic: 'linked_lists',
    difficulty: 'medium',
    type: 'fill_in_blank',
    prompt: 'Fill in the blank to complete the iterative pointer redirection in reverse_list.',
    codeSnippet: `ListNode* reverseList(ListNode* head) {
  ListNode* prev = nullptr;
  ListNode* curr = head;
  while (curr != nullptr) {
    ListNode* nextNode = curr->next;
    {{BLANK_1}} = prev;
    prev = curr;
    curr = nextNode;
  }
  return prev;
}`,
    fillBlankData: {
      template: '{{BLANK_1}} = prev',
      blanks: [
        { id: 'BLANK_1', label: 'Pointer reversal target', hint: 'Member of curr pointing backwards', acceptedAnswers: ['curr->next', 'curr.next'] }
      ]
    },
    correctAnswer: { BLANK_1: 'curr->next' },
    explanation: 'curr->next must be redirected backwards to prev to reverse the link direction.',
    timeLimitSeconds: 20,
    provenance: 'verified_bank'
  },

  // 22. Matching: Algorithm to Worst-Case Time Complexity (Medium)
  {
    id: 'mat-001',
    title: 'Matching: Algorithms to Worst-Case Time Complexity',
    topic: 'complexity_analysis',
    difficulty: 'medium',
    type: 'matching',
    prompt: 'Match each algorithm on the left with its corresponding worst-case time complexity on the right.',
    matchingData: {
      leftColumn: [
        { id: 'L1', text: 'Merge Sort' },
        { id: 'L2', text: 'Naive Quick Sort (Last Element Pivot)' },
        { id: 'L3', text: 'Binary Search' },
        { id: 'L4', text: 'Hash Table Lookup (Separate Chaining Collision)' }
      ],
      rightColumn: [
        { id: 'R1', text: 'O(N log N)' },
        { id: 'R2', text: 'O(N²)' },
        { id: 'R3', text: 'O(log N)' },
        { id: 'R4', text: 'O(N)' }
      ],
      correctPairs: [
        { leftId: 'L1', rightId: 'R1' },
        { leftId: 'L2', rightId: 'R2' },
        { leftId: 'L3', rightId: 'R3' },
        { leftId: 'L4', rightId: 'R4' }
      ]
    },
    correctAnswer: [
      { leftId: 'L1', rightId: 'R1' },
      { leftId: 'L2', rightId: 'R2' },
      { leftId: 'L3', rightId: 'R3' },
      { leftId: 'L4', rightId: 'R4' }
    ],
    explanation: 'Merge sort is guaranteed O(N log N); Quick sort degrades to O(N²) when partitions are lopsided; Binary search is O(log N); Hash table degenerates to O(N) when all keys hash to the same bucket.',
    timeLimitSeconds: 25,
    provenance: 'verified_bank'
  },

  // 23. Matching: Data Structures to Primary Use Cases (Easy)
  {
    id: 'mat-002',
    title: 'Matching: Data Structures to Canonical Use Cases',
    topic: 'stacks_and_queues',
    difficulty: 'easy',
    type: 'matching',
    prompt: 'Match each core data structure with its canonical system design / algorithmic use case.',
    matchingData: {
      leftColumn: [
        { id: 'DS1', text: 'LIFO Stack' },
        { id: 'DS2', text: 'FIFO Queue' },
        { id: 'DS3', text: 'Min-Heap Priority Queue' },
        { id: 'DS4', text: 'Trie (Prefix Tree)' }
      ],
      rightColumn: [
        { id: 'UC1', text: 'Call stack & Undo operations' },
        { id: 'UC2', text: 'Breadth-First Search & Buffer streaming' },
        { id: 'UC3', text: 'Dijkstra shortest path & Job scheduling' },
        { id: 'UC4', text: 'Search engine autocomplete' }
      ],
      correctPairs: [
        { leftId: 'DS1', rightId: 'UC1' },
        { leftId: 'DS2', rightId: 'UC2' },
        { leftId: 'DS3', rightId: 'UC3' },
        { leftId: 'DS4', rightId: 'UC4' }
      ]
    },
    correctAnswer: [
      { leftId: 'DS1', rightId: 'UC1' },
      { leftId: 'DS2', rightId: 'UC2' },
      { leftId: 'DS3', rightId: 'UC3' },
      { leftId: 'DS4', rightId: 'UC4' }
    ],
    explanation: 'Stacks power undo/function frames (LIFO). Queues support level-order traversal (FIFO). Heaps retrieve min/max keys in O(log N). Tries query prefix matches in O(length of string).',
    timeLimitSeconds: 25,
    provenance: 'verified_bank'
  },

  // 24. Arrange Steps: Merge Sort Sequence (Medium)
  {
    id: 'arr-seq-001',
    title: 'Arrange Steps: Merge Sort Recursive Pipeline',
    topic: 'searching_and_sorting',
    difficulty: 'medium',
    type: 'arrange_steps',
    prompt: 'Arrange the core execution steps of Merge Sort in correct chronological sequence.',
    arrangeStepsData: {
      items: [
        { id: 's1', text: 'Check base case: if length <= 1, return array' },
        { id: 's2', text: 'Calculate midpoint: mid = length / 2' },
        { id: 's3', text: 'Recursively sort left half and right half' },
        { id: 's4', text: 'Merge two sorted subarrays into a single combined sorted array' }
      ],
      correctOrderIds: ['s1', 's2', 's3', 's4']
    },
    correctAnswer: ['s1', 's2', 's3', 's4'],
    explanation: 'Merge sort follows Divide-and-Conquer: check base case, partition at midpoint, conquer subproblems recursively, then combine (merge) the sorted halves.',
    timeLimitSeconds: 20,
    provenance: 'verified_bank'
  },

  // 25. Pseudocode Challenge: Recursive Binary Search Tracing (Easy)
  {
    id: 'pcode-001',
    title: 'Pseudocode: Trace Recursive Call Sequence',
    topic: 'recursion_and_backtracking',
    difficulty: 'easy',
    type: 'pseudocode',
    prompt: 'Trace the recursive call count for `binary_search(arr, 0, 7, target=9)` where `arr = [1, 3, 5, 7, 9, 11, 13, 15]`. How many recursive steps occur to locate 9?',
    codeSnippet: `function binary_search(arr, low, high, target):
    if low > high: return -1
    mid = low + (high - low) / 2
    if arr[mid] == target:
        return mid
    else if arr[mid] < target:
        return binary_search(arr, mid + 1, high, target)
    else:
        return binary_search(arr, low, mid - 1, target)`,
    options: ['2 steps', '1 step', '3 steps', '4 steps'],
    correctAnswer: '2 steps',
    explanation: 'Step 1: low=0, high=7, mid=3 (arr[3]=7 < 9) -> recurse right with low=4, high=7. Step 2: low=4, high=7, mid=5 (arr[5]=11 > 9) -> recurse left with low=4, high=4. Step 3 finds arr[4]=9 in total 2 recursive descent calls.',
    timeLimitSeconds: 20,
    provenance: 'verified_bank'
  },

  // 26. Interactive Array Challenge: Two Pointer Subarray Selection (Medium)
  {
    id: 'ia-001',
    title: 'Interactive 3D Array: Kadane Maximum Subarray Selection',
    topic: 'arrays_and_strings',
    difficulty: 'medium',
    type: 'interactive_array',
    prompt: 'Select the contiguous subarray slice [start_index, end_index] that yields the maximum possible sum in array `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`.',
    interactiveArrayData: {
      initialArray: [-2, 1, -3, 4, -1, 2, 1, -5, 4],
      pointers: [
        { id: 'left', label: 'Start (L)', initialIndex: 0, color: '#38bdf8' },
        { id: 'right', label: 'End (R)', initialIndex: 0, color: '#a855f7' }
      ],
      targetDescription: 'Select start index 3 and end index 6 (subarray [4, -1, 2, 1], sum = 6)',
      actionType: 'select_subarray',
      validationTarget: { startIndex: 3, endIndex: 6 }
    },
    correctAnswer: { startIndex: 3, endIndex: 6 },
    explanation: 'The slice from index 3 to 6 is [4, -1, 2, 1], which sums to 6. Any other subarray produces a lower sum.',
    timeLimitSeconds: 25,
    provenance: 'verified_bank'
  },

  // 27. Diagnostic Assessment: Language & Level Calibration (Assessment)
  {
    id: 'diag-001',
    title: 'Diagnostic: Array In-Place Rotation Complexity',
    topic: 'arrays_and_strings',
    difficulty: 'medium',
    type: 'mcq',
    prompt: 'What is the minimum auxiliary space complexity required to rotate an array of n elements to the right by k steps in-place?',
    options: ['O(1)', 'O(k)', 'O(n)', 'O(log n)'],
    correctAnswer: 'O(1)',
    explanation: 'Using the triple reversal algorithm (reverse whole array, reverse first k, reverse remaining n-k) requires O(1) extra space and O(n) time.',
    timeLimitSeconds: 20,
    provenance: 'diagnostic'
  },

  // 28. Diagnostic Assessment: Tree Depth Calculation (Assessment)
  {
    id: 'diag-002',
    title: 'Diagnostic: Binary Tree Max Depth Recursion',
    topic: 'trees_and_bst',
    difficulty: 'easy',
    type: 'predict_output',
    prompt: 'What is the recurrence relation for the maximum depth of a binary tree given root node?',
    codeSnippet: `int maxDepth(TreeNode* root) {
  if (root == nullptr) return 0;
  return 1 + max(maxDepth(root->left), maxDepth(root->right));
}`,
    options: [
      '1 + max(leftDepth, rightDepth)',
      '1 + leftDepth + rightDepth',
      'max(leftDepth, rightDepth)',
      '2 * max(leftDepth, rightDepth)'
    ],
    correctAnswer: '1 + max(leftDepth, rightDepth)',
    explanation: 'The depth of a tree is 1 (for the root itself) plus the maximum depth of its subtrees.',
    timeLimitSeconds: 20,
    provenance: 'diagnostic'
  },

  // 29. Extreme Hard: Segment Tree with Lazy Propagation (Extreme Hard)
  {
    id: 'seg-ext-001',
    title: 'Extreme Hard: Segment Tree Lazy Range Updates',
    topic: 'trees_and_bst',
    difficulty: 'extreme_hard',
    type: 'complexity',
    prompt: 'What is the per-query time complexity for a range addition update [L, R] on a Segment Tree with Lazy Propagation across an array of size N?',
    options: ['O(log N)', 'O(N)', 'O(1)', 'O(sqrt(N))'],
    correctAnswer: 'O(log N)',
    explanation: 'Lazy propagation defers updates to child nodes until the interval is queried, ensuring at most 4 nodes per tree level are visited, yielding O(log N) worst-case time.',
    timeLimitSeconds: 15,
    provenance: 'verified_bank'
  }
];

export function getSanitizedChallenge(challenge: Challenge): any {
  // Strip correctAnswer and referenceSolution, and sanitize hidden test cases / answer keys
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
  if (safeCopy.matchingData) {
    const { correctPairs, ...safeMatching } = safeCopy.matchingData;
    safeCopy.matchingData = safeMatching;
  }
  if (safeCopy.arrangeStepsData) {
    const { correctOrderIds, ...safeArrange } = safeCopy.arrangeStepsData;
    safeCopy.arrangeStepsData = safeArrange;
  }
  if (safeCopy.fillBlankData) {
    safeCopy.fillBlankData = {
      template: safeCopy.fillBlankData.template,
      blanks: safeCopy.fillBlankData.blanks.map(b => {
        const { acceptedAnswers, ...safeB } = b;
        return safeB;
      })
    };
  }
  if (safeCopy.interactiveArrayData) {
    const { validationTarget, ...safeArray } = safeCopy.interactiveArrayData;
    safeCopy.interactiveArrayData = safeArray;
  }
  return safeCopy;
}

