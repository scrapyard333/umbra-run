import { useMemo } from 'react'

export default function Background() {
  const stars = useMemo(
    () => Array.from({ length: 80 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 62,
      s: Math.random() * 2 + 1, d: Math.random() * 4,
    })),
    [],
  )

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#06060d] via-[#150c2e] to-[#0a0a14]">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute animate-twinkle rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }}
        />
      ))}

      <div className="absolute right-[12%] top-[9%] h-24 w-24 rounded-full bg-[radial-gradient(circle_at_35%_35%,#ffffff,#dccbff_55%,#9b6bff)] shadow-[0_0_90px_35px_rgba(168,85,247,0.5)] sm:h-32 sm:w-32" />

      <svg className="absolute bottom-[12%] h-[34%] w-full" viewBox="0 0 1200 300" preserveAspectRatio="none">
        <polygon fill="#1a1036" points="0,300 0,140 90,60 170,150 270,40 380,160 470,70 580,170 690,50 790,150 900,80 1000,160 1100,60 1200,140 1200,300" />
        <polygon fill="#0f0a22" points="0,300 0,210 120,150 220,220 340,130 460,225 600,160 720,230 850,140 980,225 1090,170 1200,220 1200,300" />
      </svg>

      <div className="absolute bottom-0 h-[12%] w-full border-t-2 border-neon bg-black shadow-[0_-4px_24px_rgba(168,85,247,0.7)]" />
    </div>
  )
}
