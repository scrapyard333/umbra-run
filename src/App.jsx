import { useGame } from './store'
import Background from './components/Background'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'

export default function App() {
  const screen = useGame((s) => s.screen)
  const modal = useGame((s) => s.modal)
  const closeModal = useGame((s) => s.closeModal)

  return (
    <div className="relative h-full w-full bg-void font-body text-white">
      {screen === 'home' && <Background />}
      {screen === 'home' && <HomeScreen />}
      {screen === 'playing' && <GameScreen />}
      {modal && (
        <div className="absolute inset-0 grid place-items-center bg-black/70">
          <div className="rounded-2xl border border-white/10 bg-panel p-8 text-center">
            <p className="font-display text-xl capitalize">{modal} arrives in Phase 5</p>
            <button onClick={closeModal} className="mt-4 rounded-xl border border-white/20 px-6 py-2">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
