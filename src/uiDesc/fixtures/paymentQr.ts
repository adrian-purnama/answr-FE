/** Sample template with bind slots for MCP UI template authoring. */
export const paymentQrTemplateDefinition = {
  version: 1 as const,
  root: {
    type: 'card' as const,
    title: 'Payment',
    children: [
      {
        type: 'status' as const,
        value: 'pending' as const,
        label: 'Awaiting payment',
        bind: 'status',
      },
      {
        type: 'media' as const,
        kind: 'payload' as const,
        payload: '',
        encoding: 'raw' as const,
        alt: 'Payment QR code',
        bindPayload: 'qr',
      },
      {
        type: 'keyValue' as const,
        rows: [
          { label: 'Order', value: '', bind: 'orderId' },
          { label: 'Amount', value: '', bind: 'amount' },
          { label: 'Expires', value: '', bind: 'expires' },
        ],
      },
      {
        type: 'buttonGroup' as const,
        buttons: [
          {
            actionId: 'Check payment status',
            label: 'Check payment status',
          },
          {
            actionId: 'Cancel',
            label: 'Cancel',
          },
        ],
      },
    ],
  },
}
