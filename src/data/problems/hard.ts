import type { CuratedProblem } from '../../types'

export const hardProblems: CuratedProblem[] = [
  {
    id: '4',
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    difficulty: 'Hard',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    compare: 'float',
    fnName: 'findMedianSortedArrays',
    pyFnName: 'find_median_sorted_arrays',
    description: `Given two sorted arrays \`nums1\` and \`nums2\`, return the **median** of the two arrays combined.

The overall run time complexity should be **O(log (m+n))**.

**Example 1**

    Input: nums1 = [1,3], nums2 = [2]
    Output: 2.0

**Example 2**

    Input: nums1 = [1,2], nums2 = [3,4]
    Output: 2.5

**Constraints**

- 0 ≤ m, n ≤ 1000
- 1 ≤ m + n`,
    starter: {
      javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function findMedianSortedArrays(nums1, nums2) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def find_median_sorted_arrays(nums1: list[int], nums2: list[int]) -> float:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function findMedianSortedArrays(nums1, nums2) {
  if (nums1.length > nums2.length) return findMedianSortedArrays(nums2, nums1)
  const m = nums1.length
  const n = nums2.length
  const half = (m + n + 1) >> 1
  let lo = 0
  let hi = m
  while (lo <= hi) {
    const i = (lo + hi) >> 1
    const j = half - i
    const l1 = i === 0 ? -Infinity : nums1[i - 1]
    const r1 = i === m ? Infinity : nums1[i]
    const l2 = j === 0 ? -Infinity : nums2[j - 1]
    const r2 = j === n ? Infinity : nums2[j]
    if (l1 <= r2 && l2 <= r1) {
      if ((m + n) % 2 === 1) return Math.max(l1, l2)
      return (Math.max(l1, l2) + Math.min(r1, r2)) / 2
    }
    if (l1 > r2) hi = i - 1
    else lo = i + 1
  }
  return 0
}
`,
      python: `def find_median_sorted_arrays(nums1: list[int], nums2: list[int]) -> float:
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    m, n = len(nums1), len(nums2)
    half = (m + n + 1) // 2
    lo, hi = 0, m
    while lo <= hi:
        i = (lo + hi) // 2
        j = half - i
        l1 = nums1[i - 1] if i > 0 else float('-inf')
        r1 = nums1[i] if i < m else float('inf')
        l2 = nums2[j - 1] if j > 0 else float('-inf')
        r2 = nums2[j] if j < n else float('inf')
        if l1 <= r2 and l2 <= r1:
            if (m + n) % 2 == 1:
                return float(max(l1, l2))
            return (max(l1, l2) + min(r1, r2)) / 2
        if l1 > r2:
            hi = i - 1
        else:
            lo = i + 1
    return 0.0
`,
    },
    tests: [
      { input: [[1, 3], [2]], expected: 2.0 },
      { input: [[1, 2], [3, 4]], expected: 2.5 },
      { input: [[0, 0], [0, 0]], expected: 0.0 },
      { input: [[], [1]], expected: 1.0 },
      { input: [[2], []], expected: 2.0 },
      { input: [[1, 3], [2, 7]], expected: 2.5 },
    ],
  },
  {
    id: '42',
    title: 'Trapping Rain Water',
    slug: 'trapping-rain-water',
    difficulty: 'Hard',
    tags: ['Array', 'Two Pointers', 'Stack'],
    compare: 'exact',
    fnName: 'trap',
    pyFnName: 'trap',
    description: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is \`1\`, compute how much **water** it can trap after raining.

**Example 1**

    Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
    Output: 6

**Example 2**

    Input: height = [4,2,0,3,2,5]
    Output: 9

**Constraints**

- 0 ≤ height.length ≤ 2·10⁴
- 0 ≤ height[i] ≤ 10⁵`,
    starter: {
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function trap(height) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def trap(height: list[int]) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function trap(height) {
  let lo = 0
  let hi = height.length - 1
  let lmax = 0
  let rmax = 0
  let water = 0
  while (lo < hi) {
    if (height[lo] < height[hi]) {
      lmax = Math.max(lmax, height[lo])
      water += lmax - height[lo]
      lo++
    } else {
      rmax = Math.max(rmax, height[hi])
      water += rmax - height[hi]
      hi--
    }
  }
  return water
}
`,
      python: `def trap(height: list[int]) -> int:
    lo, hi = 0, len(height) - 1
    lmax = rmax = water = 0
    while lo < hi:
        if height[lo] < height[hi]:
            lmax = max(lmax, height[lo])
            water += lmax - height[lo]
            lo += 1
        else:
            rmax = max(rmax, height[hi])
            water += rmax - height[hi]
            hi -= 1
    return water
`,
    },
    tests: [
      { input: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { input: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { input: [[]], expected: 0 },
      { input: [[1, 2, 3]], expected: 0 },
      { input: [[3, 0, 3]], expected: 3 },
      { input: [[5, 4, 1, 2]], expected: 1 },
    ],
  },
  {
    id: '72',
    title: 'Edit Distance',
    slug: 'edit-distance',
    difficulty: 'Hard',
    tags: ['String', 'Dynamic Programming'],
    compare: 'exact',
    fnName: 'minDistance',
    pyFnName: 'min_distance',
    description: `Given two strings \`word1\` and \`word2\`, return the **minimum number of operations** required to convert \`word1\` to \`word2\`.

Allowed operations: insert a character, delete a character, replace a character.

**Example 1**

    Input: word1 = "horse", word2 = "ros"
    Output: 3
    horse → rorse (replace h) → rose (delete r) → ros (delete e)

**Example 2**

    Input: word1 = "intention", word2 = "execution"
    Output: 5

**Constraints**

- 0 ≤ word1.length, word2.length ≤ 500`,
    starter: {
      javascript: `/**
 * @param {string} word1
 * @param {string} word2
 * @return {number}
 */
function minDistance(word1, word2) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def min_distance(word1: str, word2: str) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function minDistance(word1, word2) {
  const m = word1.length
  const n = word2.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        cur[j] = prev[j - 1]
      } else {
        cur[j] = 1 + Math.min(prev[j - 1], prev[j], cur[j - 1])
      }
    }
    prev = cur
  }
  return prev[n]
}
`,
      python: `def min_distance(word1: str, word2: str) -> int:
    m, n = len(word1), len(word2)
    prev = list(range(n + 1))
    for i in range(1, m + 1):
        cur = [i] + [0] * n
        for j in range(1, n + 1):
            if word1[i - 1] == word2[j - 1]:
                cur[j] = prev[j - 1]
            else:
                cur[j] = 1 + min(prev[j - 1], prev[j], cur[j - 1])
        prev = cur
    return prev[n]
`,
    },
    tests: [
      { input: ['horse', 'ros'], expected: 3 },
      { input: ['intention', 'execution'], expected: 5 },
      { input: ['', ''], expected: 0 },
      { input: ['abc', ''], expected: 3 },
      { input: ['', 'abc'], expected: 3 },
      { input: ['abc', 'abc'], expected: 0 },
      { input: ['kitten', 'sitting'], expected: 3 },
    ],
  },
  {
    id: '84',
    title: 'Largest Rectangle in Histogram',
    slug: 'largest-rectangle-in-histogram',
    difficulty: 'Hard',
    tags: ['Array', 'Stack', 'Monotonic Stack'],
    compare: 'exact',
    fnName: 'largestRectangleArea',
    pyFnName: 'largest_rectangle_area',
    description: `Given an array of integers \`heights\` representing a histogram (each bar has width \`1\`), return the area of the **largest rectangle** that fits inside the histogram.

**Example 1**

    Input: heights = [2,1,5,6,2,3]
    Output: 10
    The 5 and 6 bars form a 5 × 2 rectangle.

**Example 2**

    Input: heights = [2,4]
    Output: 4

**Constraints**

- 1 ≤ heights.length ≤ 10⁵
- 0 ≤ heights[i] ≤ 10⁴`,
    starter: {
      javascript: `/**
 * @param {number[]} heights
 * @return {number}
 */
function largestRectangleArea(heights) {
  // your code here ᓚᘏᗢ
}
`,
      python: `def largest_rectangle_area(heights: list[int]) -> int:
    # your code here ᓚᘏᗢ
    pass
`,
    },
    solution: {
      javascript: `function largestRectangleArea(heights) {
  const stack = [] // indices of increasing bars
  let best = 0
  for (let i = 0; i <= heights.length; i++) {
    const h = i === heights.length ? 0 : heights[i]
    while (stack.length && heights[stack[stack.length - 1]] >= h) {
      const height = heights[stack.pop()]
      const left = stack.length ? stack[stack.length - 1] + 1 : 0
      best = Math.max(best, height * (i - left))
    }
    stack.push(i)
  }
  return best
}
`,
      python: `def largest_rectangle_area(heights: list[int]) -> int:
    stack = []  # indices of increasing bars
    best = 0
    for i in range(len(heights) + 1):
        h = 0 if i == len(heights) else heights[i]
        while stack and heights[stack[-1]] >= h:
            height = heights[stack.pop()]
            left = stack[-1] + 1 if stack else 0
            best = max(best, height * (i - left))
        stack.append(i)
    return best
`,
    },
    tests: [
      { input: [[2, 1, 5, 6, 2, 3]], expected: 10 },
      { input: [[2, 4]], expected: 4 },
      { input: [[1]], expected: 1 },
      { input: [[0]], expected: 0 },
      { input: [[2, 2, 2, 2]], expected: 8 },
      { input: [[6, 7, 5, 2, 4, 5, 9, 3]], expected: 16 },
    ],
  },
]
