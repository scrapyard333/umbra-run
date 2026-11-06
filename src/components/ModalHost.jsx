import { useGame } from '../store'
import SkinsModal from './modals/SkinsModal.jsx'
import DailyModal from './modals/DailyModal.jsx'
import TrophiesModal from './modals/TrophiesModal.jsx'
import RanksModal from './modals/RanksModal.jsx'
import SettingsModal from './modals/SettingsModal.jsx'

const MODALS = { skins: SkinsModal, daily: DailyModal, trophies: TrophiesModal, ranks: RanksModal, settings: SettingsModal }

export default function ModalHost() {
  const modal = useGame((s) => s.modal)
  const Modal = MODALS[modal]
  return Modal ? <Modal /> : null
}
