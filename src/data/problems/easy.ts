import type { CuratedProblem } from '../../types'

export const easyProblems: CuratedProblem[] = [
  {
    id: '1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    compare: 'unordered',
    fnName: 'twoSum',
    pyFnName: 'two_sum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return **the indices of the two numbers that add up to \`target\`**.

Each input has exactly one solution, and you may not use the same element twice. Return the answer in any order.

**Example 1**

    Input: nums = [2,7,11,15], target = 9
    Output: [0,1]
    Because nums[0] + nums[1] == 9.

**Example 2**

    Input: nums = [3,2,4], target = 6
    Output: [1,2]

**Constraints**

- 2 ≤ nums.length ≤ 10⁴
- Exactly one valid answer exists.

**Follow-up:** can you beat O(n²)?`,
    starter: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function twoSum(nums, target) {
  const seen = new Map()
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i]
    if (seen.has(need)) return [seen.get(need), i]
    seen.set(nums[i], i)
  }
  return []
}
`,
      python: `def two_sum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []
`,
    },
    tests: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
      { input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { input: [[0, 4, 3, 0], 0], expected: [0, 3] },
      { input: [[1, 5, 9, 13], 22], expected: [2, 3] },
    ],
  },
  {
    id: '9',
    title: 'Palindrome Number',
    slug: 'palindrome-number',
    difficulty: 'Easy',
    tags: ['Math'],
    compare: 'exact',
    fnName: 'isPalindrome',
    pyFnName: 'is_palindrome',
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a **palindrome** — it reads the same backward as forward.

**Example 1**

    Input: x = 121
    Output: true

**Example 2**

    Input: x = -121
    Output: false
    From right to left it reads 121-. Negative numbers are never palindromes.

**Constraints**

- -2³¹ ≤ x ≤ 2³¹ - 1

**Follow-up:** can you solve it without converting to a string?`,
    starter: {
      javascript: `/**
 * @param {number} x
 * @return {boolean}
 */
function isPalindrome(x) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def is_palindrome(x: int) -> bool:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function isPalindrome(x) {
  if (x < 0) return false
  let rev = 0
  let n = x
  while (n > 0) {
    rev = rev * 10 + (n % 10)
    n = Math.floor(n / 10)
  }
  return rev === x
}
`,
      python: `def is_palindrome(x: int) -> bool:
    if x < 0:
        return False
    rev, n = 0, x
    while n > 0:
        rev = rev * 10 + n % 10
        n //= 10
    return rev == x
`,
    },
    tests: [
      { input: [121], expected: true },
      { input: [-121], expected: false },
      { input: [10], expected: false },
      { input: [0], expected: true },
      { input: [12321], expected: true },
      { input: [1234567899], expected: false },
    ],
  },
  {
    id: '20',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    tags: ['String', 'Stack'],
    compare: 'exact',
    fnName: 'isValid',
    pyFnName: 'is_valid',
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

A string is valid when:

1. Open brackets are closed by the same type of bracket.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket.

**Example 1**

    Input: s = "()[]{}"
    Output: true

**Example 2**

    Input: s = "([)]"
    Output: false

**Constraints**

- 0 ≤ s.length ≤ 10⁴`,
    starter: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def is_valid(s: str) -> bool:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' }
  const stack = []
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch)
    } else if (stack.pop() !== pairs[ch]) {
      return false
    }
  }
  return stack.length === 0
}
`,
      python: `def is_valid(s: str) -> bool:
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for ch in s:
        if ch in '([{':
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack
`,
    },
    tests: [
      { input: ['()'], expected: true },
      { input: ['()[]{}'], expected: true },
      { input: ['(]'], expected: false },
      { input: ['([)]'], expected: false },
      { input: ['{[]}'], expected: true },
      { input: [''], expected: true },
      { input: ['('], expected: false },
      { input: [']'], expected: false },
    ],
  },
  {
    id: '21',
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    tags: ['Linked List', 'Recursion'],
    compare: 'exact',
    fnName: 'mergeTwoLists',
    pyFnName: 'merge_two_lists',
    description: `Merge two sorted lists into one sorted list and return it.

*(leetie keeps I/O JSON-friendly, so the lists arrive as plain arrays — the merging logic is the same as the linked-list version.)*

**Example 1**

    Input: list1 = [1,2,4], list2 = [1,3,4]
    Output: [1,1,2,3,4,4]

**Example 2**

    Input: list1 = [], list2 = [0]
    Output: [0]

**Constraints**

- 0 ≤ list length ≤ 50
- Both inputs are sorted in non-decreasing order.`,
    starter: {
      javascript: `/**
 * @param {number[]} list1
 * @param {number[]} list2
 * @return {number[]}
 */
function mergeTwoLists(list1, list2) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def merge_two_lists(list1: list[int], list2: list[int]) -> list[int]:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function mergeTwoLists(list1, list2) {
  const out = []
  let i = 0
  let j = 0
  while (i < list1.length && j < list2.length) {
    out.push(list1[i] <= list2[j] ? list1[i++] : list2[j++])
  }
  return out.concat(list1.slice(i), list2.slice(j))
}
`,
      python: `def merge_two_lists(list1: list[int], list2: list[int]) -> list[int]:
    out = []
    i = j = 0
    while i < len(list1) and j < len(list2):
        if list1[i] <= list2[j]:
            out.append(list1[i]); i += 1
        else:
            out.append(list2[j]); j += 1
    return out + list1[i:] + list2[j:]
`,
    },
    tests: [
      { input: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
      { input: [[], []], expected: [] },
      { input: [[], [0]], expected: [0] },
      { input: [[5], [1, 2, 3]], expected: [1, 2, 3, 5] },
      { input: [[-3, 0, 3], [-2, 2]], expected: [-3, -2, 0, 2, 3] },
    ],
  },
  {
    id: '121',
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    tags: ['Array', 'Dynamic Programming'],
    compare: 'exact',
    fnName: 'maxProfit',
    pyFnName: 'max_profit',
    description: `You are given an array \`prices\` where \`prices[i]\` is the price of a stock on day \`i\`.

You want to maximize profit by choosing **one day to buy** and a **later day to sell**. Return the maximum profit; if no profit is possible, return \`0\`.

**Example 1**

    Input: prices = [7,1,5,3,6,4]
    Output: 5
    Buy on day 2 (price 1), sell on day 5 (price 6).

**Example 2**

    Input: prices = [7,6,4,3,1]
    Output: 0

**Constraints**

- 1 ≤ prices.length ≤ 10⁵`,
    starter: {
      javascript: `/**
 * @param {number[]} prices
 * @return {number}
 */
function maxProfit(prices) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def max_profit(prices: list[int]) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function maxProfit(prices) {
  let low = Infinity
  let best = 0
  for (const p of prices) {
    low = Math.min(low, p)
    best = Math.max(best, p - low)
  }
  return best
}
`,
      python: `def max_profit(prices: list[int]) -> int:
    low = float('inf')
    best = 0
    for p in prices:
        low = min(low, p)
        best = max(best, p - low)
    return best
`,
    },
    tests: [
      { input: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { input: [[7, 6, 4, 3, 1]], expected: 0 },
      { input: [[1, 2]], expected: 1 },
      { input: [[2, 4, 1]], expected: 2 },
      { input: [[3, 3, 5, 0, 0, 3, 1, 4]], expected: 4 },
      { input: [[1]], expected: 0 },
    ],
  },
  {
    id: '242',
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    difficulty: 'Easy',
    tags: ['Hash Table', 'String', 'Sorting'],
    compare: 'exact',
    fnName: 'isAnagram',
    pyFnName: 'is_anagram',
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an **anagram** of \`s\` — the same letters rearranged.

**Example 1**

    Input: s = "anagram", t = "nagaram"
    Output: true

**Example 2**

    Input: s = "rat", t = "car"
    Output: false

**Constraints**

- 0 ≤ s.length, t.length ≤ 5·10⁴
- Lowercase English letters.`,
    starter: {
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def is_anagram(s: str, t: str) -> bool:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function isAnagram(s, t) {
  if (s.length !== t.length) return false
  const count = {}
  for (const ch of s) count[ch] = (count[ch] ?? 0) + 1
  for (const ch of t) {
    if (!count[ch]) return false
    count[ch]--
  }
  return true
}
`,
      python: `def is_anagram(s: str, t: str) -> bool:
    from collections import Counter
    return Counter(s) == Counter(t)
`,
    },
    tests: [
      { input: ['anagram', 'nagaram'], expected: true },
      { input: ['rat', 'car'], expected: false },
      { input: ['a', 'ab'], expected: false },
      { input: ['aacc', 'ccac'], expected: false },
      { input: ['', ''], expected: true },
      { input: ['listen', 'silent'], expected: true },
    ],
  },
  {
    id: '704',
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    tags: ['Array', 'Binary Search'],
    compare: 'exact',
    fnName: 'search',
    pyFnName: 'search',
    description: `Given a sorted (ascending) array of integers \`nums\` and an integer \`target\`, return the index of \`target\`, or \`-1\` if it is not present.

Your algorithm must run in **O(log n)**.

**Example 1**

    Input: nums = [-1,0,3,5,9,12], target = 9
    Output: 4

**Example 2**

    Input: nums = [-1,0,3,5,9,12], target = 2
    Output: -1

**Constraints**

- 1 ≤ nums.length ≤ 10⁴
- All values are unique.`,
    starter: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def search(nums: list[int], target: int) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function search(nums, target) {
  let lo = 0
  let hi = nums.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (nums[mid] === target) return mid
    if (nums[mid] < target) lo = mid + 1
    else hi = mid - 1
  }
  return -1
}
`,
      python: `def search(nums: list[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
`,
    },
    tests: [
      { input: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { input: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { input: [[5], 5], expected: 0 },
      { input: [[5], -5], expected: -1 },
      { input: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10], expected: 9 },
      { input: [[2, 4, 6], 2], expected: 0 },
    ],
  },
  {
    id: '70',
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
    compare: 'exact',
    fnName: 'climbStairs',
    pyFnName: 'climb_stairs',
    description: `You are climbing a staircase with \`n\` steps. Each move you can climb **1 or 2 steps**. In how many distinct ways can you reach the top?

**Example 1**

    Input: n = 2
    Output: 2
    (1+1, 2)

**Example 2**

    Input: n = 3
    Output: 3
    (1+1+1, 1+2, 2+1)

**Constraints**

- 1 ≤ n ≤ 45`,
    starter: {
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
function climbStairs(n) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def climb_stairs(n: int) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function climbStairs(n) {
  let a = 1
  let b = 1
  for (let i = 0; i < n - 1; i++) {
    ;[a, b] = [b, a + b]
  }
  return b
}
`,
      python: `def climb_stairs(n: int) -> int:
    a = b = 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b
`,
    },
    tests: [
      { input: [2], expected: 2 },
      { input: [3], expected: 3 },
      { input: [1], expected: 1 },
      { input: [10], expected: 89 },
      { input: [20], expected: 10946 },
      { input: [45], expected: 1836311903 },
    ],
  },
]
