import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { bootstrapAuth } from '#/context/authContext'
import { pageHead } from '#/lib/seo'

export const Route = createFileRoute('/admin')({
  ssr: false,
  beforeLoad: async () => {
    const user = await bootstrapAuth()
    if (!user) {
      throw redirect({ to: '/login' })
    }
    if (!user.isAdmin) {
      throw redirect({ to: '/dashboard' })
    }
    return { user }
  },
  head: () =>
    pageHead({
      title: 'Admin',
      path: '/admin',
      noIndex: true,
    }),
  component: AdminLayout,
})

function AdminLayout() {
  return <Outlet />
}
