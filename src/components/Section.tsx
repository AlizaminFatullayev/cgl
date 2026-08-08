import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * The recurring section rhythm of the marketing site: a small uppercase
 * eyebrow, then an h2, then the content. Backgrounds alternate between plain
 * --background and the tinted --gradient-subtle band with border-y.
 */

export function Eyebrow({
  children,
  tone = 'primary',
}: {
  children: ReactNode
  tone?: 'primary' | 'muted'
}) {
  return (
    <p
      className={cn(
        'text-xs font-semibold tracking-wide uppercase sm:text-sm',
        tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {children}
    </p>
  )
}

export function Section({
  children,
  tinted = false,
  narrow = false,
  className,
  ...rest
}: {
  children: ReactNode
  /** Renders the tinted band with border-y that alternates through the page. */
  tinted?: boolean
  /** py-10 instead of py-20, for the dealer banner. */
  narrow?: boolean
  className?: string
} & Omit<React.ComponentProps<'section'>, 'className' | 'children'>) {
  return (
    <section
      className={cn(
        tinted && 'bg-gradient-subtle border-border border-y',
        className,
      )}
      {...rest}
    >
      <div
        className={cn(
          'container mx-auto px-4 sm:px-6',
          narrow ? 'py-10' : 'py-20',
        )}
      >
        {children}
      </div>
    </section>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  titleTail,
  subtitle,
  centered = false,
  className,
  id,
}: {
  eyebrow: string
  title: string
  /**
   * Optional tail rendered in --primary after `title`, which stays in
   * --foreground. This two-tone heading is the original site's style.
   * `title` should carry its own trailing space when a tail is supplied.
   */
  titleTail?: string
  subtitle?: string
  centered?: boolean
  className?: string
  id?: string
}) {
  return (
    <div
      className={cn(
        'max-w-2xl space-y-3',
        centered && 'mx-auto text-center',
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        id={id}
        className="text-3xl font-bold tracking-tight text-balance sm:text-4xl"
      >
        {title}
        {titleTail && <span className="text-primary">{titleTail}</span>}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg">{subtitle}</p>
      )}
    </div>
  )
}
