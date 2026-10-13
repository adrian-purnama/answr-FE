import { createFileRoute } from '@tanstack/react-router'
import RegisterForm from '#/components/forms/RegisterForm'
import { inviteRedirectSearch } from '#/lib/collaborationInvite'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/_auth/register')({
  validateSearch: inviteRedirectSearch,
  component: RegisterPage,
  head: () =>
    pageHead({
      title: 'Sign up',
      description: 'Create an answr account and start embedding AI chat on your site.',
      path: '/register',
    }),
})

function RegisterPage() {
  const { redirect } = Route.useSearch()

  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-md px-6 pt-12 pb-10 text-[var(--ink)] sm:mt-12 sm:pt-16">
      <RegisterForm redirect={redirect} />
    </main>
  )
}
