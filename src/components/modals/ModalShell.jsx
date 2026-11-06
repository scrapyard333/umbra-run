import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useGame } from '../../store'

export default function ModalShell({ icon: Icon, title, subtitle, accent = '#a855f7', right, maxWidth = 'max-w-lg', children }) {
  const closeModal = useGame((s) => s.closeModal)

  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Escape') closeModal() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeModal])

  return (
    <div className="absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onClick={closeModal}>
      <div
        role="dialog"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`my-auto w-full ${maxWidth} rounded-3xl border bg-panel p-5 sm:p-6`}
        style={{ borderColor: `${accent}55`, boxShadow: `0 0 60px ${accent}33` }}
      >
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border" style={{ borderColor: `${accent}77`, background: `${accent}22`, color: accent }}>
            <Icon size={22} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-bold leading-tight sm:text-2xl">{title}</h2>
            <p className="text-sm text-white/60">{subtitle}</p>
          </div>
          {right}
          <button onClick={closeModal} aria-label="Close" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export function OrbPill({ value }) {
  return (
    <div className="hidden items-center gap-1.5 rounded-full border border-orb/40 bg-orb/10 px-3 py-1.5 sm:flex">
      <span className="h-3 w-3 rounded-full bg-orb" />
      <span className="font-display text-sm font-bold text-orb">{value}</span>
    </div>
  )
}
