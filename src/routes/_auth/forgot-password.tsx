import { createFileRoute } from '@tanstack/react-router'
import ForgotPasswordForm from '#/components/forms/ForgotPasswordForm'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/_auth/forgot-password')({
  component: ForgotPasswordPage,
  head: () =>
    pageHead({
      title: 'Forgot password',
      description: 'Reset your answr account password.',
      path: '/forgot-password',
    }),
})

function ForgotPasswordPage() {
  return (
    <main className="mx-auto mt-8 mb-12 w-full max-w-md px-6 pt-12 pb-10 text-[var(--ink)] sm:mt-12 sm:pt-16">
      <ForgotPasswordForm />
    </main>
  )
}
