import { useGame } from './store'
import Background from './components/Background'
import HomeScreen from './components/HomeScreen'
import GameScreen from './components/GameScreen'
import ModalHost from './components/ModalHost'

export default function App() {
  const screen = useGame((s) => s.screen)

  return (
    <div className="relative h-full w-full bg-void font-body text-white">
      {screen === 'home' && <Background />}
      {screen === 'home' && <HomeScreen />}
      {screen === 'playing' && <GameScreen />}
      <ModalHost />
    </div>
  )
}
