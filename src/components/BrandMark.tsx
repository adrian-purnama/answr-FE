import { useBranding } from '#/context/brandingContext'
import { cn } from '#/lib/utils'

type BrandMarkSize = 'sm' | 'md' | 'lg'

type BrandMarkProps = {
  /** Light = white/paper wordmark (dark backgrounds). Dark = primary wordmark (light backgrounds). */
  variant?: 'light' | 'dark'
  size?: BrandMarkSize
  showWordmark?: boolean
  className?: string
  logoClassName?: string
}

const SIZE: Record<
  BrandMarkSize,
  { wrap: string; logo: string; wordmark: string }
> = {
  sm: {
    wrap: 'gap-2.5',
    logo: 'h-8 w-auto object-contain',
    wordmark: 'text-xl tracking-tight',
  },
  md: {
    wrap: 'gap-3',
    logo: 'h-10 w-auto object-contain sm:h-14',
    wordmark: 'text-2xl tracking-tight sm:text-3xl',
  },
  lg: {
    wrap: 'gap-4',
    logo: 'h-14 w-auto object-contain sm:h-16',
    wordmark: 'text-4xl tracking-tight sm:text-5xl',
  },
}

export default function BrandMark({
  variant = 'dark',
  size = 'lg',
  showWordmark = true,
  className,
  logoClassName,
}: BrandMarkProps) {
  const { appName } = useBranding()
  const styles = SIZE[size]
  const logoSrc =
    variant === 'light'
      ? '/answr-logo-light.svg'
      : '/answr-logo-dark.svg'
  const nameColor = variant === 'light' ? 'var(--paper)' : 'var(--primary)'

  return (
    <span className={cn('inline-flex items-center', styles.wrap, className)}>
      <img
        src={logoSrc}
        alt=""
        className={cn(styles.logo, logoClassName)}
        aria-hidden
      />
      {showWordmark ? (
        <span className={styles.wordmark}>
          <span className="nojegaye" style={{ color: nameColor }}>
            answr
          </span>
          <span className="nojegaye" style={{ color: 'var(--accent)' }}>
            .id
          </span>
        </span>
      ) : null}
      <span className="sr-only">{appName}</span>
    </span>
  )
}
