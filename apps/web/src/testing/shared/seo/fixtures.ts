import type { TSeoResolved } from '@blog/service';

export function makeSeo(overrides: Partial<TSeoResolved> = {}): TSeoResolved {
  return {
    title: 'Example Title',
    description: 'Example description.',
    ogTitle: 'Example OG Title',
    ogDescription: 'Example OG description.',
    ogImageUrl: undefined,
    ...overrides,
  };
}
