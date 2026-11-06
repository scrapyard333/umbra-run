import { useMemo } from 'react'

const COLORS = ['#a855f7', '#22d3ee', '#facc15', '#ef4444', '#4ade80', '#fb923c']

export default function Confetti() {
  const pieces = useMemo(
    () => Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.2 + Math.random() * 1.8,
      size: 6 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
    })),
    [],
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block rounded-[2px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.6,
            background: p.color,
            animation: `confetti-fall ${p.dur}s ${p.delay}s linear forwards`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  )
}
