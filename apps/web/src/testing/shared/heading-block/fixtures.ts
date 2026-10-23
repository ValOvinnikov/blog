import type { THeadingBlock } from '@blog/config';

export const mockHeadingBlock = (
  overrides: Partial<THeadingBlock> = {},
): THeadingBlock => ({
  heading: 'Heading',
  supportingText: undefined,
  ...overrides,
});
