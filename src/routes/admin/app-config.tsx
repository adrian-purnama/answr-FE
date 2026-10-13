import { Link, createFileRoute } from '@tanstack/react-router'
import AppConfigForm from '#/components/forms/AppConfigForm'
import { hintClassName } from '#/lib/ui-classes'

export const Route = createFileRoute('/admin/app-config')({
  component: AdminAppConfigPage,
})

function AdminAppConfigPage() {
  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-2xl px-6 py-10 text-[var(--ink)] sm:mt-12">
      <div className="mb-8">
        <Link
          to="/admin"
          className={`${hintClassName} no-underline transition hover:text-[var(--ink)]`}
        >
          ← Admin
        </Link>
        <h1 className="mt-3 text-2xl font-medium tracking-tight">App config</h1>
        <p className={`mt-2 ${hintClassName}`}>
          Update branding and whether login or registration stays open.
        </p>
      </div>

      <AppConfigForm />
    </main>
  )
}
