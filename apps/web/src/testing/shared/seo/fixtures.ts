import type { TSeoResolved } from '@blog/service';

export const mockSeo = (
  overrides: Partial<TSeoResolved> = {},
): TSeoResolved => {
  return {
    title: 'Example Title',
    description: 'Example description.',
    ogTitle: 'Example OG Title',
    ogDescription: 'Example OG description.',
    ogImage: undefined,
    ...overrides,
  };
};
