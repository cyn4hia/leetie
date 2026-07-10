# leetie ᓚᘏᗢ

LeetCode but it's cute! Retro-themed daily practice, fully static — problem browser,
in-browser IDE, real code execution, grading, a daily problem, and a pixel debugging cat
who believes in you.

- **light theme**: purple retro computer · **dark theme**: cozy pink retro terminal
- **3,985 problems** from the LeetCode catalog, browsable + searchable + rollable (gacha!)
- **official starters everywhere**: every free problem ships LeetCode's own JS + Python
  starter snippets, function signatures, and typed metadata
- **submission checks for thousands of problems**: auto-generated from each problem's own
  examples (so expected outputs are LeetCode's, not guesses) — marked ☆; supports linked
  lists, trees, in-place/void problems, and any-order/float comparisons
- **20 curated classics** (★) with hand-built test suites + reference solutions
- **Monaco editor** (the editor engine inside VS Code) side-by-side with the problem
- **runs code for real**: JavaScript in a sandboxed web worker, Python via Pyodide (WASM)
- **VS Code sync**: link a local file, edit it in VS Code, every save syncs into leetie
- **the cat**: wanders, naps, flicks her tail; click her when you need moral support

## dev

```bash
npm install
npm run dev
```

## problem data

The full catalog, plus content + starters + metadata for **every free problem**, is
pre-fetched into `public/data/` (committed, so deploys need no network). To refresh:

```bash
npm run fetch-problems -- --content all   # catalog + all free problem content
node scripts/generate-checks.mjs          # regenerate ☆ submission checks
```

`generate-checks.mjs` builds each problem's checks by pairing LeetCode's official sample
inputs (`exampleTestcases`) with outputs parsed from the statement's examples, and
cross-validates the two. It is deliberately conservative — design problems,
multiple-valid-answer problems, and anything ambiguous is skipped rather than risking a
check that rejects correct code. Paid-only problems are excluded.

Curated (★) problems live in `src/data/problems/` — adding one there gives it a
hand-built test suite, starter code, and reference solutions.

## deploy to GitHub Pages

1. Push this repo to GitHub as `leetie` (the Vite `base` is `/leetie/`).
2. Repo **Settings → Pages → Source: GitHub Actions**.
3. Push to `main` — `.github/workflows/deploy.yml` builds and deploys automatically.

Site lands at `https://<you>.github.io/leetie/`.

## VS Code connection

Click **⛓ vs code** in the editor toolbar and pick a local file (e.g.
`~/leetie/scratch.py`). Open the same file in VS Code — every save syncs into leetie,
where ▶ run / ✓ submit use the synced code. 💾 writes the leetie editor back to the file.
(Uses the File System Access API — Chromium browsers only.)

## how running & grading works

Everything executes locally in your browser — no backend:

- **JavaScript** runs in a throwaway web worker (8s timeout, console captured)
- **Python** runs in Pyodide inside a worker (~10 MB one-time CDN download)
- **▶ run** uses the first 3 sample tests; **✓ submit** runs the full suite
- answers compare with per-problem modes (exact / any-order / set-of-sets / float ε)
- all tests green → S/A/B rank by total runtime, solution reveal, streak +1, cat party

## roadmap

- [ ] head-to-head **racer mode** — two players, same problem, first green suite wins.
  The groundwork is here: grading is pure functions over JSON test results, so race
  state can sync over WebRTC/WebSocket later without touching the runners.
- [ ] more curated problems with tests (PRs to `src/data/problems/` welcome)
- [ ] cat accessories. obviously.
