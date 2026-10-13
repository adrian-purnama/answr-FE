import { Link, createFileRoute } from '@tanstack/react-router'
import { CreditCard, Settings, Users } from 'lucide-react'
import { useAuth } from '#/context/authContext'
import { cardClassName, hintClassName } from '#/lib/ui-classes'

export const Route = createFileRoute('/admin/')({
  component: AdminIndexPage,
})

function AdminIndexPage() {
  const { user } = useAuth()

  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-3xl px-6 py-10 text-[var(--ink)] sm:mt-12">
      <h1 className="mb-2 text-2xl font-medium">Admin</h1>
      <p className={`mb-8 ${hintClassName}`}>Signed in as {user?.email}</p>

      <div className="grid gap-4">
        <Link
          to="/admin/app-config"
          className={`${cardClassName} flex items-start gap-4 p-6 no-underline transition hover:border-[var(--ink)]`}
        >
          <Settings
            className="mt-0.5 size-5 shrink-0 text-[var(--ink)]"
            aria-hidden
          />
          <div>
            <h2 className="mb-1 text-lg font-medium text-[var(--ink)]">
              App config
            </h2>
            <p className={hintClassName}>App name, logo, and login settings.</p>
          </div>
        </Link>

        <Link
          to="/admin/plans"
          className={`${cardClassName} flex items-start gap-4 p-6 no-underline transition hover:border-[var(--ink)]`}
        >
          <CreditCard
            className="mt-0.5 size-5 shrink-0 text-[var(--ink)]"
            aria-hidden
          />
          <div>
            <h2 className="mb-1 text-lg font-medium text-[var(--ink)]">Plans</h2>
            <p className={hintClassName}>Manage subscription plans.</p>
          </div>
        </Link>

        <Link
          to="/admin/users"
          className={`${cardClassName} flex items-start gap-4 p-6 no-underline transition hover:border-[var(--ink)]`}
        >
          <Users
            className="mt-0.5 size-5 shrink-0 text-[var(--ink)]"
            aria-hidden
          />
          <div>
            <h2 className="mb-1 text-lg font-medium text-[var(--ink)]">Users</h2>
            <p className={hintClassName}>Search and manage users.</p>
          </div>
        </Link>
      </div>
    </main>
  )
}
