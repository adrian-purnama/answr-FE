import { createFileRoute, useLoaderData } from '@tanstack/react-router'
import WhatsAppSection from '#/components/whatsApp/WhatsAppSection'

export const Route = createFileRoute(
  '/_authenticated/project/$id/tools/whatsapp',
)({
  component: ToolsWhatsAppPage,
})

function ToolsWhatsAppPage() {
  const { apiKey } = useLoaderData({ from: '/_authenticated/project/$id' })

  return <WhatsAppSection apiKeyId={apiKey.id} />
}
