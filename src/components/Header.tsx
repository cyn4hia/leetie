import { useLeetie } from '../store'
import { todayString, yesterdayString } from '../lib/daily'
import type { Difficulty, LayoutMode } from '../types'

const DIFFS: Difficulty[] = ['Easy', 'Medium', 'Hard']
const LAYOUTS: Array<{ id: LayoutMode; label: string; hint: string }> = [
  { id: 'split', label: '◧ both', hint: 'problem + editor side by side' },
  { id: 'problem', label: '☰ read', hint: 'problem only' },
  { id: 'editor', label: '⌨ code', hint: 'editor only' },
]

export function Header() {
  const theme = useLeetie((s) => s.theme)
  const toggleTheme = useLeetie((s) => s.toggleTheme)
  const layout = useLeetie((s) => s.layout)
  const setLayout = useLeetie((s) => s.setLayout)
  const difficulties = useLeetie((s) => s.difficulties)
  const toggleDifficulty = useLeetie((s) => s.toggleDifficulty)
  const streak = useLeetie((s) => s.streak)
  const toggleSidebar = useLeetie((s) => s.toggleSidebar)

  const streakAlive = streak.lastDay === todayString() || streak.lastDay === yesterdayString()
  const streakCount = streakAlive ? streak.count : 0

  return (
    <header className="header">
      <button className="btn small" onClick={toggleSidebar} title="toggle problem list">
        ☰
      </button>
      <span className="logo px">
        <span className="cat-face">ᓚᘏᗢ</span> leetie
      </span>

      <span style={{ display: 'inline-flex', gap: 6 }}>
        {DIFFS.map((d) => (
          <button
            key={d}
            className={`chip ${d.toLowerCase()} ${difficulties.includes(d) ? 'on' : ''}`}
            onClick={() => toggleDifficulty(d)}
            title={`toggle ${d.toLowerCase()} problems`}
          >
            {d.toLowerCase()}
          </button>
        ))}
      </span>

      <div className="header-spacer" />

      <span className="streak px" title="solve any problem to keep the streak alive!">
        🐾 streak: {streakCount}
      </span>

      <span className="seg">
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            className={layout === l.id ? 'on' : ''}
            onClick={() => setLayout(l.id)}
            title={l.hint}
          >
            {l.label}
          </button>
        ))}
      </span>

      <button className="btn" onClick={toggleTheme} title="switch theme">
        {theme === 'light' ? '☾ dark' : '☀ light'}
      </button>
    </header>
  )
}
