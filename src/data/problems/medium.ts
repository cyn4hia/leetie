import type { CuratedProblem } from '../../types'

export const mediumProblems: CuratedProblem[] = [
  {
    id: '3',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    compare: 'exact',
    fnName: 'lengthOfLongestSubstring',
    pyFnName: 'length_of_longest_substring',
    description: `Given a string \`s\`, find the length of the **longest substring** without duplicate characters.

**Example 1**

    Input: s = "abcabcbb"
    Output: 3
    The answer is "abc".

**Example 2**

    Input: s = "pwwkew"
    Output: 3
    The answer is "wke" — note it must be a substring, not a subsequence.

**Constraints**

- 0 ≤ s.length ≤ 5·10⁴`,
    starter: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def length_of_longest_substring(s: str) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function lengthOfLongestSubstring(s) {
  const last = new Map()
  let left = 0
  let best = 0
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (last.has(ch) && last.get(ch) >= left) {
      left = last.get(ch) + 1
    }
    last.set(ch, i)
    best = Math.max(best, i - left + 1)
  }
  return best
}
`,
      python: `def length_of_longest_substring(s: str) -> int:
    last = {}
    left = best = 0
    for i, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1
        last[ch] = i
        best = max(best, i - left + 1)
    return best
`,
    },
    tests: [
      { input: ['abcabcbb'], expected: 3 },
      { input: ['bbbbb'], expected: 1 },
      { input: ['pwwkew'], expected: 3 },
      { input: [''], expected: 0 },
      { input: [' '], expected: 1 },
      { input: ['au'], expected: 2 },
      { input: ['dvdf'], expected: 3 },
      { input: ['abba'], expected: 2 },
    ],
  },
  {
    id: '15',
    title: '3Sum',
    slug: '3sum',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Sorting'],
    compare: 'set',
    fnName: 'threeSum',
    pyFnName: 'three_sum',
    description: `Given an integer array \`nums\`, return all unique triplets \`[nums[i], nums[j], nums[k]]\` with distinct indices such that the three values sum to \`0\`.

The solution set must not contain duplicate triplets. Any order is fine.

**Example 1**

    Input: nums = [-1,0,1,2,-1,-4]
    Output: [[-1,-1,2],[-1,0,1]]

**Example 2**

    Input: nums = [0,1,1]
    Output: []

**Constraints**

- 3 ≤ nums.length ≤ 3000`,
    starter: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number[][]}
 */
function threeSum(nums) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def three_sum(nums: list[int]) -> list[list[int]]:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function threeSum(nums) {
  nums = [...nums].sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue
    let lo = i + 1
    let hi = nums.length - 1
    while (lo < hi) {
      const sum = nums[i] + nums[lo] + nums[hi]
      if (sum < 0) lo++
      else if (sum > 0) hi--
      else {
        out.push([nums[i], nums[lo], nums[hi]])
        while (lo < hi && nums[lo] === nums[lo + 1]) lo++
        while (lo < hi && nums[hi] === nums[hi - 1]) hi--
        lo++
        hi--
      }
    }
  }
  return out
}
`,
      python: `def three_sum(nums: list[int]) -> list[list[int]]:
    nums = sorted(nums)
    out = []
    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        lo, hi = i + 1, len(nums) - 1
        while lo < hi:
            s = nums[i] + nums[lo] + nums[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                out.append([nums[i], nums[lo], nums[hi]])
                while lo < hi and nums[lo] == nums[lo + 1]:
                    lo += 1
                while lo < hi and nums[hi] == nums[hi - 1]:
                    hi -= 1
                lo += 1
                hi -= 1
    return out
`,
    },
    tests: [
      { input: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
      { input: [[0, 1, 1]], expected: [] },
      { input: [[0, 0, 0]], expected: [[0, 0, 0]] },
      { input: [[-2, 0, 1, 1, 2]], expected: [[-2, 0, 2], [-2, 1, 1]] },
      { input: [[1, -1, -1, 0]], expected: [[-1, 0, 1]] },
      { input: [[3, 0, -2, -1, 1, 2]], expected: [[-2, -1, 3], [-2, 0, 2], [-1, 0, 1]] },
    ],
  },
  {
    id: '49',
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    difficulty: 'Medium',
    tags: ['Hash Table', 'String', 'Sorting'],
    compare: 'set',
    fnName: 'groupAnagrams',
    pyFnName: 'group_anagrams',
    description: `Given an array of strings \`strs\`, group the anagrams together. Return the groups in any order (order within a group doesn't matter either).

**Example 1**

    Input: strs = ["eat","tea","tan","ate","nat","bat"]
    Output: [["bat"],["nat","tan"],["ate","eat","tea"]]

**Example 2**

    Input: strs = [""]
    Output: [[""]]

**Constraints**

- 1 ≤ strs.length ≤ 10⁴
- Lowercase English letters.`,
    starter: {
      javascript: `/**
 * @param {string[]} strs
 * @return {string[][]}
 */
function groupAnagrams(strs) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def group_anagrams(strs: list[str]) -> list[list[str]]:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function groupAnagrams(strs) {
  const groups = new Map()
  for (const s of strs) {
    const key = [...s].sort().join('')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(s)
  }
  return [...groups.values()]
}
`,
      python: `def group_anagrams(strs: list[str]) -> list[list[str]]:
    from collections import defaultdict
    groups = defaultdict(list)
    for s in strs:
        groups[''.join(sorted(s))].append(s)
    return list(groups.values())
`,
    },
    tests: [
      {
        input: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']],
        expected: [['eat', 'tea', 'ate'], ['tan', 'nat'], ['bat']],
      },
      { input: [['']], expected: [['']] },
      { input: [['a']], expected: [['a']] },
      { input: [['ab', 'ba', 'abc']], expected: [['ab', 'ba'], ['abc']] },
      {
        input: [['ddddddddddg', 'dgggggggggg']],
        expected: [['ddddddddddg'], ['dgggggggggg']],
      },
    ],
  },
  {
    id: '238',
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    tags: ['Array', 'Prefix Sum'],
    compare: 'exact',
    fnName: 'productExceptSelf',
    pyFnName: 'product_except_self',
    description: `Given an integer array \`nums\`, return an array \`answer\` where \`answer[i]\` is the product of all elements of \`nums\` **except** \`nums[i]\`.

You must solve it in **O(n)** time **without using division**.

**Example 1**

    Input: nums = [1,2,3,4]
    Output: [24,12,8,6]

**Example 2**

    Input: nums = [-1,1,0,-3,3]
    Output: [0,0,9,0,0]

**Constraints**

- 2 ≤ nums.length ≤ 10⁵`,
    starter: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number[]}
 */
function productExceptSelf(nums) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def product_except_self(nums: list[int]) -> list[int]:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function productExceptSelf(nums) {
  const n = nums.length
  const out = new Array(n).fill(1)
  let acc = 1
  for (let i = 0; i < n; i++) {
    out[i] = acc
    acc *= nums[i]
  }
  acc = 1
  for (let i = n - 1; i >= 0; i--) {
    out[i] *= acc
    acc *= nums[i]
  }
  return out
}
`,
      python: `def product_except_self(nums: list[int]) -> list[int]:
    n = len(nums)
    out = [1] * n
    acc = 1
    for i in range(n):
        out[i] = acc
        acc *= nums[i]
    acc = 1
    for i in range(n - 1, -1, -1):
        out[i] *= acc
        acc *= nums[i]
    return out
`,
    },
    tests: [
      { input: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { input: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { input: [[2, 2]], expected: [2, 2] },
      { input: [[1, 1, 1, 1]], expected: [1, 1, 1, 1] },
      { input: [[0, 0]], expected: [0, 0] },
      { input: [[1, -1]], expected: [-1, 1] },
    ],
  },
  {
    id: '11',
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers', 'Greedy'],
    compare: 'exact',
    fnName: 'maxArea',
    pyFnName: 'max_area',
    description: `You are given an array \`height\` of length \`n\`. There are \`n\` vertical lines where the \`i\`-th line spans from \`(i, 0)\` to \`(i, height[i])\`.

Find two lines that, together with the x-axis, form a container holding the **most water**. Return that maximum area.

**Example 1**

    Input: height = [1,8,6,2,5,4,8,3,7]
    Output: 49
    Lines at index 1 and 8: min(8,7) × (8-1) = 49.

**Example 2**

    Input: height = [1,1]
    Output: 1

**Constraints**

- 2 ≤ n ≤ 10⁵`,
    starter: {
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def max_area(height: list[int]) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function maxArea(height) {
  let lo = 0
  let hi = height.length - 1
  let best = 0
  while (lo < hi) {
    best = Math.max(best, Math.min(height[lo], height[hi]) * (hi - lo))
    if (height[lo] < height[hi]) lo++
    else hi--
  }
  return best
}
`,
      python: `def max_area(height: list[int]) -> int:
    lo, hi = 0, len(height) - 1
    best = 0
    while lo < hi:
        best = max(best, min(height[lo], height[hi]) * (hi - lo))
        if height[lo] < height[hi]:
            lo += 1
        else:
            hi -= 1
    return best
`,
    },
    tests: [
      { input: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { input: [[1, 1]], expected: 1 },
      { input: [[4, 3, 2, 1, 4]], expected: 16 },
      { input: [[1, 2, 1]], expected: 2 },
      { input: [[2, 3, 4, 5, 18, 17, 6]], expected: 17 },
      { input: [[1, 2, 4, 3]], expected: 4 },
    ],
  },
  {
    id: '322',
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium',
    tags: ['Array', 'Dynamic Programming', 'BFS'],
    compare: 'exact',
    fnName: 'coinChange',
    pyFnName: 'coin_change',
    description: `You are given coins of different denominations (\`coins\`) and a total \`amount\`. Return the **fewest number of coins** needed to make up that amount, or \`-1\` if it cannot be made. You have infinite coins of each kind.

**Example 1**

    Input: coins = [1,2,5], amount = 11
    Output: 3
    11 = 5 + 5 + 1

**Example 2**

    Input: coins = [2], amount = 3
    Output: -1

**Constraints**

- 1 ≤ coins.length ≤ 12
- 0 ≤ amount ≤ 10⁴`,
    starter: {
      javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
function coinChange(coins, amount) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def coin_change(coins: list[int], amount: int) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity)
  dp[0] = 0
  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (c <= a && dp[a - c] + 1 < dp[a]) dp[a] = dp[a - c] + 1
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount]
}
`,
      python: `def coin_change(coins: list[int], amount: int) -> int:
    INF = float('inf')
    dp = [0] + [INF] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if c <= a and dp[a - c] + 1 < dp[a]:
                dp[a] = dp[a - c] + 1
    return -1 if dp[amount] == INF else dp[amount]
`,
    },
    tests: [
      { input: [[1, 2, 5], 11], expected: 3 },
      { input: [[2], 3], expected: -1 },
      { input: [[1], 0], expected: 0 },
      { input: [[1, 5, 10, 25], 63], expected: 6 },
      { input: [[1, 2, 5, 10], 27], expected: 4 },
      { input: [[186, 419, 83, 408], 6249], expected: 20 },
    ],
  },
  {
    id: '200',
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    tags: ['Array', 'DFS', 'BFS', 'Matrix'],
    compare: 'exact',
    fnName: 'numIslands',
    pyFnName: 'num_islands',
    description: `Given an \`m × n\` grid of \`"1"\` (land) and \`"0"\` (water), return the number of **islands**.

An island is surrounded by water and formed by connecting adjacent land cells horizontally or vertically.

**Example 1**

    Input: grid = [["1","1","0"],
                   ["1","0","0"],
                   ["0","0","1"]]
    Output: 2

**Constraints**

- 1 ≤ m, n ≤ 300
- Cells are the strings "0" and "1".`,
    starter: {
      javascript: `/**
 * @param {string[][]} grid
 * @return {number}
 */
function numIslands(grid) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def num_islands(grid: list[list[str]]) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function numIslands(grid) {
  const m = grid.length
  const n = grid[0].length
  let count = 0
  function sink(r, c) {
    if (r < 0 || r >= m || c < 0 || c >= n || grid[r][c] !== '1') return
    grid[r][c] = '0'
    sink(r + 1, c)
    sink(r - 1, c)
    sink(r, c + 1)
    sink(r, c - 1)
  }
  for (let r = 0; r < m; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === '1') {
        count++
        sink(r, c)
      }
    }
  }
  return count
}
`,
      python: `def num_islands(grid: list[list[str]]) -> int:
    m, n = len(grid), len(grid[0])
    count = 0

    def sink(r: int, c: int) -> None:
        if r < 0 or r >= m or c < 0 or c >= n or grid[r][c] != '1':
            return
        grid[r][c] = '0'
        sink(r + 1, c); sink(r - 1, c); sink(r, c + 1); sink(r, c - 1)

    for r in range(m):
        for c in range(n):
            if grid[r][c] == '1':
                count += 1
                sink(r, c)
    return count
`,
    },
    tests: [
      {
        input: [
          [
            ['1', '1', '1', '1', '0'],
            ['1', '1', '0', '1', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
          ],
        ],
        expected: 1,
      },
      {
        input: [
          [
            ['1', '1', '0', '0', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '1', '0', '0'],
            ['0', '0', '0', '1', '1'],
          ],
        ],
        expected: 3,
      },
      { input: [[['1']]], expected: 1 },
      { input: [[['0']]], expected: 0 },
      {
        input: [
          [
            ['1', '0', '1'],
            ['0', '1', '0'],
            ['1', '0', '1'],
          ],
        ],
        expected: 5,
      },
    ],
  },
  {
    id: '347',
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent-elements',
    difficulty: 'Medium',
    tags: ['Array', 'Hash Table', 'Heap', 'Bucket Sort'],
    compare: 'unordered',
    fnName: 'topKFrequent',
    pyFnName: 'top_k_frequent',
    description: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` **most frequent** elements, in any order.

The answer is guaranteed to be unique.

**Example 1**

    Input: nums = [1,1,1,2,2,3], k = 2
    Output: [1,2]

**Example 2**

    Input: nums = [1], k = 1
    Output: [1]

**Constraints**

- 1 ≤ nums.length ≤ 10⁵
- k is in the range [1, number of distinct elements]

**Follow-up:** better than O(n log n)?`,
    starter: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} k
 * @return {number[]}
 */
function topKFrequent(nums, k) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def top_k_frequent(nums: list[int], k: int) -> list[int]:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function topKFrequent(nums, k) {
  const freq = new Map()
  for (const n of nums) freq.set(n, (freq.get(n) ?? 0) + 1)
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map(([n]) => n)
}
`,
      python: `def top_k_frequent(nums: list[int], k: int) -> list[int]:
    from collections import Counter
    return [n for n, _ in Counter(nums).most_common(k)]
`,
    },
    tests: [
      { input: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { input: [[1], 1], expected: [1] },
      { input: [[4, 4, 4, 6, 6, 7], 2], expected: [4, 6] },
      { input: [[1, 2, 1, 2, 1, 2, 3], 2], expected: [1, 2] },
      { input: [[-1, -1, -2], 1], expected: [-1] },
    ],
  },
]
