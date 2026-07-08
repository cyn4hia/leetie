import { useEffect } from 'react'
import { useLeetie } from './store'
import { loadCatalog } from './lib/catalog'
import { Header } from './components/Header'
import { ProblemList } from './components/ProblemList'
import { ProblemPanel } from './components/ProblemPanel'
import { EditorPanel } from './components/EditorPanel'
import { CatPet } from './components/CatPet'
import { RetroWindow } from './components/RetroWindow'

function Welcome() {
  return (
    <RetroWindow title="welcome.exe" className="welcome-pane">
      <div className="welcome">
        <div className="welcome-cat px">ᓚᘏᗢ</div>
        <h2>hi! i'm leetie</h2>
        <p>
          hit <b>✦ ROLL ✦</b> in the sidebar to summon a random problem,
          <br />
          or grab <b>today's byte</b> for your daily practice ♡
        </p>
      </div>
    </RetroWindow>
  )
}

export default function App() {
  const theme = useLeetie((s) => s.theme)
  const layout = useLeetie((s) => s.layout)
  const sidebarOpen = useLeetie((s) => s.sidebarOpen)
  const selectedSlug = useLeetie((s) => s.selectedSlug)
  const setCatalog = useLeetie((s) => s.setCatalog)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    loadCatalog().then(setCatalog)
  }, [setCatalog])

  return (
    <div className="app">
      <Header />
      <div className="main">
        {sidebarOpen && <ProblemList />}
        {selectedSlug ? (
          <div className="panes" data-layout={layout}>
            <ProblemPanel />
            <EditorPanel />
          </div>
        ) : (
          <Welcome />
        )}
      </div>
      <CatPet />
    </div>
  )
}
