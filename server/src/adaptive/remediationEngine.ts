import { DSATopic, Difficulty, Challenge } from '../types/shared.js';

export interface RemediationPackage {
  topic: DSATopic;
  conceptKey: string;
  conceptTitle: string;
  explanation: string;
  workedExample: string;
  commonPitfalls: string[];
  practiceChallengeId: string;
}

export class RemediationEngine {
  private static REMEDIATION_KNOWLEDGE_BASE: Record<string, Omit<RemediationPackage, 'practiceChallengeId'>> = {
    'arrays_and_strings': {
      topic: 'arrays_and_strings',
      conceptKey: 'two_pointers_sliding_window',
      conceptTitle: 'Two Pointers & Sliding Window Invariant',
      explanation: 'When searching for subarrays or pair sums, two pointers avoid O(N^2) brute force by maintaining a window boundary condition. Moving the right pointer expands the window; moving the left pointer contracts it once constraints are broken.',
      workedExample: 'Finding pair with sum K in sorted array: start L=0, R=n-1. If arr[L]+arr[R] < K, increase L to get a bigger sum. If > K, decrease R to get a smaller sum.',
      commonPitfalls: ['Forgetting that input array must be sorted for two-pointer pair sum', 'Off-by-one errors on window size calculation (R - L + 1)']
    },
    'searching_and_sorting': {
      topic: 'searching_and_sorting',
      conceptKey: 'binary_search_boundary',
      conceptTitle: 'Binary Search Midpoint & Boundary Invariants',
      explanation: 'Binary search works by discarding half the search space per iteration on monotonic domains. Use low + (high - low) // 2 to prevent integer overflow.',
      workedExample: 'To find the first occurrence of X: when arr[mid] == X, record mid as best candidate and continue searching left with high = mid - 1.',
      commonPitfalls: ['Infinite loops when low <= high condition is mismatched with high = mid or low = mid', 'Integer overflow in languages like C++/Java when doing (low + high) / 2']
    },
    'linked_lists': {
      topic: 'linked_lists',
      conceptKey: 'fast_slow_pointers_reversal',
      conceptTitle: 'Fast/Slow Pointers & In-Place Reversal',
      explanation: 'Using a slow pointer moving 1 step and a fast pointer moving 2 steps detects cycles in O(N) time and O(1) space. If fast reaches NULL, there is no cycle. If they meet, a cycle exists.',
      workedExample: 'Reversing a singly linked list in-place: maintain prev = null, curr = head. Save next = curr.next, redirect curr.next = prev, advance prev = curr, curr = next.',
      commonPitfalls: ['Dereferencing null pointer (e.g. fast.next when fast is null)', 'Losing the rest of the list before redirecting the current pointer']
    },
    'stacks_and_queues': {
      topic: 'stacks_and_queues',
      conceptKey: 'monotonic_stack',
      conceptTitle: 'Monotonic Stack Principle',
      explanation: 'A monotonic stack maintains elements in strictly increasing or decreasing order. It solves Next Greater Element and Largest Rectangle in Histogram in linear O(N) time.',
      workedExample: 'Next Greater Element: Traverse from right to left. While stack is not empty and stack.peek() <= arr[i], pop from stack. The top of the stack is now the next greater element.',
      commonPitfalls: ['Failing to check for empty stack before calling pop/peek', 'Popping in the wrong comparison direction for next greater vs next smaller']
    },
    'trees_and_bst': {
      topic: 'trees_and_bst',
      conceptKey: 'bst_inorder_property',
      conceptTitle: 'BST Inorder Property & Tree Traversal',
      explanation: 'In a Binary Search Tree, all nodes in the left subtree are strictly smaller than the root, and all nodes in the right subtree are strictly larger. An Inorder Traversal (Left -> Root -> Right) of a BST always yields elements in strictly sorted ascending order.',
      workedExample: 'Validating BST: Pass valid range (min_val, max_val) to helper. Each node val must satisfy min_val < node.val < max_val, recursing down with updated bounds.',
      commonPitfalls: ['Only checking immediate children instead of the entire subtree bounds', 'Confusing Preorder (Root, L, R) with Inorder (L, Root, R)']
    },
    'graphs': {
      topic: 'graphs',
      conceptKey: 'bfs_shortest_path_cycle',
      conceptTitle: 'BFS Shortest Path & Visited Tracking',
      explanation: 'Breadth-First Search (BFS) using a FIFO queue finds the shortest path in unweighted graphs level by level. A visited set or array is mandatory to prevent infinite loops in cyclic graphs.',
      workedExample: 'Queue initialized with [start], visited = {start}, dist = 0. While queue not empty, pop level by level, explore neighbors; if neighbor not in visited, mark visited and push to queue.',
      commonPitfalls: ['Marking node visited when popping from queue rather than when pushing to queue, resulting in duplicate queue entries', 'Using DFS instead of BFS when looking for minimum edges']
    },
    'dynamic_programming': {
      topic: 'dynamic_programming',
      conceptKey: 'dp_memoization_subproblems',
      conceptTitle: 'Optimal Substructure & Overlapping Subproblems',
      explanation: 'DP breaks a problem down into smaller overlapping subproblems. Define state clearly (e.g., dp[i] = best value using first i items). Solve base cases first, then write the recurrence relation.',
      workedExample: 'Coin change: dp[amount] = min(dp[amount - coin] + 1) for coin in coins. Initialize dp array with infinity, dp[0] = 0.',
      commonPitfalls: ['Missing or incorrect base cases', 'Incorrect iteration order (e.g., using forward state before it has been computed)']
    },
    'complexity_analysis': {
      topic: 'complexity_analysis',
      conceptKey: 'big_o_nested_loops',
      conceptTitle: 'Big-O Asymptotic Upper Bounds',
      explanation: 'Big-O describes upper bound scalability. Consecutive loops add together: O(A + B). Nested loops multiply: O(A * B). Halving steps each time yields logarithmic O(log N).',
      workedExample: 'Outer loop runs N times, inner loop runs 1 to N: total iterations = N * (N + 1) / 2 = O(N^2).',
      commonPitfalls: ['Ignoring hidden complexity in library calls (e.g., Python `in` on a list is O(N), not O(1))', 'Assuming two independent sequential loops are O(N^2) instead of O(N)']
    }
  };

  /**
   * Generates a remediation package tailored to a struggling topic
   */
  public static getRemediationPackage(topic: DSATopic, fallbackChallengeId: string): RemediationPackage {
    const info = this.REMEDIATION_KNOWLEDGE_BASE[topic] || {
      topic,
      conceptKey: `${topic}_fundamentals`,
      conceptTitle: `${topic.replace(/_/g, ' ').toUpperCase()} Core Fundamentals`,
      explanation: `Review core algorithmic patterns and invariant conditions for ${topic.replace(/_/g, ' ')}. Practice breaking problems into verifiable intermediate steps.`,
      workedExample: 'Trace small example inputs by hand, writing down variable values after each step.',
      commonPitfalls: ['Boundary condition oversights', 'Edge case omissions (empty inputs, single element, negative numbers)']
    };

    return {
      ...info,
      practiceChallengeId: fallbackChallengeId
    };
  }

  public static getRemediation(topic: DSATopic, fallbackChallengeId: string = ''): RemediationPackage {
    return this.getRemediationPackage(topic, fallbackChallengeId);
  }
}
