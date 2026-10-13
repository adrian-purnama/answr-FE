import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
  useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'react-hot-toast'
import Footer from '../components/Footer'
import Header from '../components/Header'
import PlanExpiryBanner from '../components/PlanExpiryBanner'
import HostWidgetEmbed from '../components/widget/HostWidgetEmbed'
import { AuthProvider } from '../context/authContext'
import { BrandingProvider } from '../context/brandingContext'
import { PlanProvider } from '../context/planContext'
import { buttonClassName, hintClassName } from '../lib/ui-classes'

import { pageHead } from '../lib/seo'
import { cn } from '../lib/utils'
import appCss from '../styles.css?url'
import widgetCss from '../widget.css?url'

function NotFoundPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col px-6 py-16 sm:py-24">
      <p className="font-brand text-sm tracking-wide text-[var(--accent)]">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
        Page not found
      </h1>
      <p className={cn('mt-2 text-sm', hintClassName)}>
        This page does not exist, or you do not have access to it.
      </p>
      <Link
        to="/"
        className={cn(buttonClassName, 'mt-8 inline-flex w-fit no-underline')}
      >
        Back to home
      </Link>
    </main>
  )
}

export const Route = createRootRoute({
  head: () => {
    const seo = pageHead({ path: '/' })
    return {
      meta: [
        { charSet: 'utf-8' },
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1',
        },
        ...seo.meta,
      ],
      links: seo.links,
    }
  },
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
})

function AppThemeShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isLiveAgent = pathname.startsWith('/liveagent')
  const theme = pathname === '/' ? 'home' : 'app'

  if (isLiveAgent) {
    return (
      <div
        data-theme="app"
        className={cn('bg-[var(--surface)] text-[var(--ink)]', className)}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      data-theme={theme}
      className={cn('bg-[var(--surface)] text-[var(--ink)]', className)}
    >
      {children}
    </div>
  )
}

function RootChrome({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isLiveAgent = pathname.startsWith('/liveagent')

  if (isLiveAgent) {
    return <AppThemeShell>{children}</AppThemeShell>
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <PlanExpiryBanner />
      <AppThemeShell className="flex-1">{children}</AppThemeShell>
      <Footer />
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isEmbed = pathname.startsWith('/embed/')
  const isLiveAgent = pathname.startsWith('/liveagent')

  // The embed document is the widget's own environment: no app stylesheet,
  // no app chrome, no app-level classes. Everything it needs ships in
  // widget.css so it renders identically inside any third-party iframe.
  if (isEmbed) {
    return (
      <html lang="en">
        <head>
          <HeadContent />
          <link rel="stylesheet" href={widgetCss} />
        </head>
        <body>
          {children}
          <Scripts />
        </body>
      </html>
    )
  }

  return (
    <html lang="en">
      <head>
        <HeadContent />
        <link rel="stylesheet" href={appCss} />
      </head>

      <body className="min-h-dvh bg-[var(--surface)] text-[var(--ink)] antialiased">
        <AuthProvider>
          <BrandingProvider>
            <PlanProvider>
              {!isLiveAgent ? (
                <HostWidgetEmbed publicKey="c3e595a262334d36c91bde6cca787192" />
              ) : null}
              <RootChrome>{children}</RootChrome>
            </PlanProvider>
          </BrandingProvider>
        </AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              border: '1px solid var(--line)',
              background: '#fff',
              color: 'var(--ink)',
              fontSize: '0.875rem',
              borderRadius: 'var(--radius-sm)',
            },
            success: {
              style: {
                border: '1px solid #bbf7d0',
                background: '#f0fdf4',
                color: 'var(--ink)',
              },
              iconTheme: {
                primary: '#16a34a',
                secondary: '#f0fdf4',
              },
            },
            error: {
              style: {
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: 'var(--ink)',
              },
              iconTheme: {
                primary: '#dc2626',
                secondary: '#fef2f2',
              },
            },
          }}
        />
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
