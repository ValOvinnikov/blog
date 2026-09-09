import type { THeadingBlock } from '@blog/config';

export const makeHeadingBlock = (
  overrides: THeadingBlock = {},
): THeadingBlock => ({
  heading: undefined,
  supportingText: undefined,
  ...overrides,
});
