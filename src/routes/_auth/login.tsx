import { createFileRoute } from '@tanstack/react-router'
import LoginForm from '#/components/forms/LoginForm'
import { inviteRedirectSearch } from '#/lib/collaborationInvite'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/_auth/login')({
  validateSearch: inviteRedirectSearch,
  component: LoginPage,
  head: () =>
    pageHead({
      title: 'Log in',
      description: 'Log in to your answr account to manage projects and widgets.',
      path: '/login',
    }),
})

function LoginPage() {
  const { redirect } = Route.useSearch()

  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-md px-6 pt-12 pb-10 text-[var(--ink)] sm:mt-12 sm:pt-16">
      <LoginForm redirect={redirect} />
    </main>
  )
}
