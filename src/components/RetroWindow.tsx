import type { ReactNode } from 'react'

export function RetroWindow({
  title,
  right,
  className,
  children,
}: {
  title: ReactNode
  right?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={`retro-window ${className ?? ''}`}>
      <div className="retro-titlebar">
        <span className="dots">
          <i />
          <i />
          <i />
        </span>
        <span className="title">{title}</span>
        {right}
      </div>
      <div className="retro-body">{children}</div>
    </section>
  )
}
