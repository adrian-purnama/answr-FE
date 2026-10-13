import { Link, createFileRoute } from '@tanstack/react-router'
import PlansAdminForm from '#/components/forms/PlansAdminForm'
import { hintClassName } from '#/lib/ui-classes'

export const Route = createFileRoute('/admin/plans')({
  component: AdminPlansPage,
})

function AdminPlansPage() {
  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-3xl px-6 py-10 text-[var(--ink)] sm:mt-12">
      <div className="mb-8">
        <Link
          to="/admin"
          className={`${hintClassName} no-underline transition hover:text-[var(--ink)]`}
        >
          ← Admin
        </Link>
        <h1 className="mt-3 text-2xl font-medium tracking-tight">Plans</h1>
        <p className={`mt-2 ${hintClassName}`}>
          Create and manage subscription plans shown on the pricing page.
        </p>
      </div>

      <PlansAdminForm />
    </main>
  )
}
