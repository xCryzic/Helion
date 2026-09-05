import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type SectionShellProps = ComponentPropsWithoutRef<'section'> & {
  children: ReactNode
  innerClassName?: string
}

export function SectionShell({
  children,
  className = '',
  innerClassName = '',
  ...props
}: SectionShellProps) {
  return (
    <section className={`section-shell ${className}`.trim()} {...props}>
      <div className={`container ${innerClassName}`.trim()}>{children}</div>
    </section>
  )
}
