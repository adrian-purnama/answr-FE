/** Sample: image URL with a short caption. */
export const mediaCaptionTemplateDefinition = {
  version: 1 as const,
  root: {
    type: 'card' as const,
    title: 'Image',
    children: [
      {
        type: 'media' as const,
        kind: 'url' as const,
        src: 'https://placehold.co/320x180/png',
        alt: 'Preview',
        bindSrc: 'imageUrl',
      },
      {
        type: 'text' as const,
        content: 'Caption goes here',
        tone: 'muted' as const,
        bind: 'caption',
      },
    ],
  },
}
