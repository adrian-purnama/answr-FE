import { Link, createFileRoute } from '@tanstack/react-router'
import UsersAdminForm from '#/components/forms/UsersAdminForm'
import { hintClassName } from '#/lib/ui-classes'

export const Route = createFileRoute('/admin/users/')({
  component: AdminUsersPage,
})

function AdminUsersPage() {
  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-3xl px-6 py-10 text-[var(--ink)] sm:mt-12">
      <div className="mb-8">
        <Link
          to="/admin"
          className={`${hintClassName} no-underline transition hover:text-[var(--ink)]`}
        >
          ← Admin
        </Link>
        <h1 className="mt-3 text-2xl font-medium tracking-tight">Users</h1>
        <p className={`mt-2 ${hintClassName}`}>
          Search users and manage their plans.
        </p>
      </div>

      <UsersAdminForm />
    </main>
  )
}
