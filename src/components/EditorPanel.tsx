import { useEffect, useRef, useState } from 'react'
import Editor from '@monaco-editor/react'
import { useLeetie, codeKey } from '../store'
import { curatedBySlug } from '../data/problems'
import { loadContent } from '../lib/catalog'
import { runTests, warmupPython } from '../runners/runner'
import { computeGrade } from '../lib/grade'
import { bridgeSupported, pickFile, watchFile, writeToFile } from '../lib/vscodeBridge'
import { RetroWindow } from './RetroWindow'
import { ResultsPanel } from './ResultsPanel'
import type { Lang } from '../types'

interface EditorLike {
  getValue(): string
  setValue(value: string): void
}

interface MonacoLike {
  editor: { defineTheme(name: string, data: unknown): void }
}

const SCRATCH: Record<Lang, string> = {
  javascript: `// scratch pad — this problem has no bundled tests, so ▶ run
// just executes your code and shows console output ᓚᘏᗢ

console.log('hello leetie!')
`,
  python: `# scratch pad — this problem has no bundled tests, so ▶ run
# just executes your code and shows printed output ᓚᘏᗢ

print('hello leetie!')
`,
}

function defineThemes(monaco: MonacoLike) {
  monaco.editor.defineTheme('leetie-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '9a86c4', fontStyle: 'italic' },
      { token: 'keyword', foreground: '8a5cf6' },
      { token: 'string', foreground: '1f9d63' },
      { token: 'number', foreground: 'c74d8a' },
    ],
    colors: {
      'editor.background': '#faf6ff',
      'editor.foreground': '#372a52',
      'editor.lineHighlightBackground': '#f1e9fd',
      'editorLineNumber.foreground': '#b6a5d9',
      'editorCursor.foreground': '#8a5cf6',
      'editor.selectionBackground': '#ddcdfb',
    },
  })
  monaco.editor.defineTheme('leetie-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: 'a06f8c', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'ff8fc7' },
      { token: 'string', foreground: '6fe3ac' },
      { token: 'number', foreground: 'ffd166' },
    ],
    colors: {
      'editor.background': '#331a30',
      'editor.foreground': '#ffe3f2',
      'editor.lineHighlightBackground': '#3f2140',
      'editorLineNumber.foreground': '#8a5578',
      'editorCursor.foreground': '#ff8fc7',
      'editor.selectionBackground': '#6b3a5c',
    },
  })
}

export function EditorPanel() {
  const slug = useLeetie((s) => s.selectedSlug)
  const lang = useLeetie((s) => s.lang)
  const setLang = useLeetie((s) => s.setLang)
  const theme = useLeetie((s) => s.theme)
  const saved = useLeetie((s) => s.code[codeKey(s.selectedSlug, s.lang)])
  const setCode = useLeetie((s) => s.setCode)
  const running = useLeetie((s) => s.running)
  const setRunning = useLeetie((s) => s.setRunning)
  const setResult = useLeetie((s) => s.setResult)
  const pyStatus = useLeetie((s) => s.pyStatus)
  const setPyStatus = useLeetie((s) => s.setPyStatus)
  const recordSolve = useLeetie((s) => s.recordSolve)
  const reveal = useLeetie((s) => s.reveal)
  const pokeCat = useLeetie((s) => s.pokeCat)

  const curated = curatedBySlug.get(slug)
  const editorRef = useRef<EditorLike | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [remoteStarter, setRemoteStarter] = useState<string | null>(null)
  const [starterReady, setStarterReady] = useState(false)

  const [linkedName, setLinkedName] = useState<string | null>(null)
  const handleRef = useRef<FileSystemFileHandle | null>(null)
  const stopWatchRef = useRef<(() => void) | null>(null)

  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const showToast = (msg: string) => {
    setToast(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2600)
  }

  // resolve a starter snippet for non-curated problems
  useEffect(() => {
    if (curated) {
      setStarterReady(true)
      return
    }
    setStarterReady(false)
    setRemoteStarter(null)
    let alive = true
    loadContent(slug).then((c) => {
      if (!alive) return
      setRemoteStarter(c?.snippets?.[lang] ?? null)
      setStarterReady(true)
    })
    return () => {
      alive = false
    }
  }, [slug, lang, curated])

  // pre-warm the python runtime as soon as python is selected
  useEffect(() => {
    if (lang === 'python' && pyStatus === 'off') {
      setPyStatus('loading')
      warmupPython((ok) => setPyStatus(ok ? 'ready' : 'error'))
    }
  }, [lang, pyStatus, setPyStatus])

  // stop watching the linked file on unmount
  useEffect(() => () => stopWatchRef.current?.(), [])

  const initial = saved ?? curated?.starter[lang] ?? remoteStarter ?? SCRATCH[lang]

  const handleChange = (value: string | undefined) => {
    clearTimeout(debounceRef.current)
    const v = value ?? ''
    debounceRef.current = setTimeout(() => setCode(slug, lang, v), 400)
  }

  async function handleRun(kind: 'run' | 'submit') {
    const code = editorRef.current?.getValue() ?? initial
    setResult(null, null)
    setRunning(true)
    const tests = curated ? (kind === 'run' ? curated.tests.slice(0, 3) : curated.tests) : []
    const result = await runTests({
      lang,
      code,
      fnName: curated ? (lang === 'python' ? curated.pyFnName : curated.fnName) : '',
      tests,
      compare: curated?.compare ?? 'exact',
    })
    setRunning(false)
    setResult(result, kind)
    if (curated && kind === 'submit') {
      const grade = computeGrade(result)
      if (grade) {
        recordSolve(slug, grade, lang)
        reveal(slug)
        pokeCat('celebrate')
      } else {
        pokeCat('sad')
      }
    }
  }

  function unlink() {
    stopWatchRef.current?.()
    stopWatchRef.current = null
    handleRef.current = null
    setLinkedName(null)
  }

  async function linkFile() {
    const handle = await pickFile()
    if (!handle) return
    unlink()
    handleRef.current = handle
    setLinkedName(handle.name)
    if (handle.name.endsWith('.py')) setLang('python')
    else if (/\.(js|mjs|ts)$/.test(handle.name)) setLang('javascript')
    stopWatchRef.current = watchFile(
      handle,
      (text) => {
        editorRef.current?.setValue(text)
        showToast(`✨ synced from ${handle.name}`)
      },
      () => {
        unlink()
        showToast('link lost — did the file move?')
      },
    )
  }

  async function saveToFile() {
    if (!handleRef.current || !editorRef.current) return
    const ok = await writeToFile(handleRef.current, editorRef.current.getValue())
    showToast(ok ? '💾 saved to linked file' : "couldn't write to the file")
  }

  function resetCode() {
    const starter = curated?.starter[lang] ?? remoteStarter ?? SCRATCH[lang]
    editorRef.current?.setValue(starter)
    showToast('↺ reset to starter code')
  }

  return (
    <RetroWindow title={`editor — ${lang === 'python' ? 'main.py' : 'main.js'}`} className="pane-editor">
      <div className="editor-toolbar">
        <select
          className="select"
          value={lang}
          onChange={(e) => setLang(e.target.value as Lang)}
          title="language"
        >
          <option value="javascript">javascript</option>
          <option value="python">python</option>
        </select>

        <button className="btn primary" onClick={() => handleRun('run')} disabled={running}>
          ▶ run
        </button>
        <button
          className="btn good"
          onClick={() => handleRun('submit')}
          disabled={running || !curated}
          title={curated ? 'run the full test suite + grade' : 'no bundled tests for this problem (gradable ones have a ★)'}
        >
          ✓ submit
        </button>
        <button className="btn small" onClick={resetCode} title="reset to starter code">
          ↺
        </button>

        <div className="toolbar-spacer" />

        {lang === 'python' && pyStatus !== 'off' && (
          <span className={`py-status ${pyStatus === 'ready' ? 'ready' : ''}`}>
            {pyStatus === 'loading' && 'loading python… (first time ~10MB)'}
            {pyStatus === 'ready' && 'python ready ✓'}
            {pyStatus === 'error' && 'python failed to load'}
          </span>
        )}

        {bridgeSupported &&
          (linkedName ? (
            <>
              <span className="linked-file" title="file is watched — save in VS Code and it syncs here">
                ⛓ {linkedName}
              </span>
              <button className="btn small" onClick={saveToFile} title="write editor contents to the linked file">
                💾
              </button>
              <button className="btn small" onClick={unlink} title="unlink file">
                ✕
              </button>
            </>
          ) : (
            <button
              className="btn small"
              onClick={linkFile}
              title="link a local file: open it in VS Code, save, and it syncs here automatically"
            >
              ⛓ vs code
            </button>
          ))}
      </div>

      <div className="editor-host">
        {starterReady ? (
          <Editor
            height="100%"
            path={`${slug}.${lang === 'python' ? 'py' : 'js'}`}
            language={lang}
            defaultValue={initial}
            theme={theme === 'light' ? 'leetie-light' : 'leetie-dark'}
            beforeMount={defineThemes}
            onMount={(editor) => {
              editorRef.current = editor as unknown as EditorLike
            }}
            onChange={handleChange}
            options={{
              fontSize: 15,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: lang === 'python' ? 4 : 2,
              wordWrap: 'on',
              padding: { top: 12 },
              automaticLayout: true,
            }}
            loading={<div className="loading-note">booting editor… ᓚᘏᗢ</div>}
          />
        ) : (
          <div className="loading-note">fetching starter code…</div>
        )}
      </div>

      <ResultsPanel />
      {toast && <div className="toast">{toast}</div>}
    </RetroWindow>
  )
}
