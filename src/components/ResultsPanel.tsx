import { useEffect, useState } from 'react'
import { useLeetie } from '../store'
import { computeGrade, GRADE_LABEL } from '../lib/grade'

const show = (v: unknown) => {
  const s = JSON.stringify(v)
  return s && s.length > 120 ? s.slice(0, 120) + '…' : (s ?? String(v))
}

export function ResultsPanel() {
  const result = useLeetie((s) => s.result)
  const resultKind = useLeetie((s) => s.resultKind)
  const running = useLeetie((s) => s.running)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (result || running) setCollapsed(false)
  }, [result, running])

  const grade = result && resultKind === 'submit' ? computeGrade(result) : null
  const passed = result?.cases.filter((c) => c.pass).length ?? 0
  const total = result?.cases.length ?? 0

  return (
    <div className={`console ${collapsed ? 'collapsed' : ''}`}>
      <div className="console-bar" onClick={() => setCollapsed(!collapsed)}>
        <span>▸ output.log</span>
        {result && total > 0 && (
          <span style={{ color: passed === total ? 'var(--good)' : 'var(--bad)' }}>
            {passed}/{total} passing
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>{collapsed ? '▲' : '▼'}</span>
      </div>
      {!collapsed && (
        <div className="console-scroll">
          {running && <div className="console-idle">running… (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧</div>}

          {!running && !result && (
            <div className="console-idle">
              hit ▶ run to test against sample cases, or ✓ submit for the full suite ᓚᘏᗢ
            </div>
          )}

          {!running && result && (
            <>
              {result.error && (
                <div className="case-line">
                  <span className="no">✗ {result.error}</span>
                </div>
              )}

              {result.cases.map((c, i) => (
                <div className="case-line" key={i}>
                  {c.pass ? (
                    <span className="ok">✓ case {i + 1}</span>
                  ) : (
                    <span className="no">✗ case {i + 1}</span>
                  )}
                  <span className="dim"> · {c.timeMs.toFixed(2)}ms</span>
                  {!c.pass && (
                    <div className="dim">
                      {'   '}input: {show(c.input)}
                      {'\n   '}expected: {show(c.expected)}
                      {c.error ? `\n   error: ${c.error}` : `\n   got: ${show(c.got)}`}
                    </div>
                  )}
                </div>
              ))}

              {result.logs.length > 0 && (
                <>
                  <div className="console-idle">── console ──</div>
                  {result.logs.map((l, i) => (
                    <div className="log-line" key={i}>
                      {l}
                    </div>
                  ))}
                </>
              )}

              {grade && (
                <div className="grade-stamp">
                  {grade}
                  <small>{GRADE_LABEL[grade]}</small>
                </div>
              )}

              {resultKind === 'submit' && !grade && total > 0 && passed < total && (
                <div className="console-idle">
                  so close! {total - passed} to go — the cat believes in you ᓚᘏᗢ
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
