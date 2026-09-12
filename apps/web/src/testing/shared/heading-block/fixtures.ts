import type { THeadingBlock } from '@blog/config';

export const makeHeadingBlock = (
  overrides: Partial<THeadingBlock> = {},
): THeadingBlock => ({
  heading: 'Heading',
  supportingText: undefined,
  ...overrides,
});
