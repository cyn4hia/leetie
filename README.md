# leetie ᓚᘏᗢ

LeetCode but it's cute! Retro-themed daily practice, fully static — problem browser,
in-browser IDE, real code execution, grading, a daily problem, and a pixel debugging cat
who believes in you.

- **light theme**: purple retro computer · **dark theme**: light-blue retro terminal
- **3,985 problems** from the LeetCode catalog, browsable + searchable
- **20 curated classics** (★) ship with tests + reference solutions in JS & Python — fully
  gradable offline with S/A/B ranks, streaks, and solved badges
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

The full catalog + content for the first 250 free problems is pre-fetched into
`public/data/` (committed, so deploys need no network). To refresh or pull more:

```bash
npm run fetch-problems                  # catalog only
npm run fetch-problems -- --content 500 # + content for first 500 free problems
```

Problems without local content are fetched at runtime from a public mirror
(alfa-leetcode-api) and cached in localStorage. Paid-only problems are excluded.

Curated (gradable) problems live in `src/data/problems/` — adding one there gives it
tests, starter code, reference solutions, and a ★ in the sidebar.

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
