import type { THeadingBlock } from '@blog/config';
import type { TRequiredHeadingBlock } from '@blog/service';

export const makeHeadingBlock = (
  overrides: THeadingBlock = {},
): THeadingBlock => ({
  heading: undefined,
  supportingText: undefined,
  ...overrides,
});

export const makeRequiredHeadingBlock = (
  overrides: Partial<TRequiredHeadingBlock> = {},
): TRequiredHeadingBlock => ({
  heading: 'Heading',
  supportingText: undefined,
  ...overrides,
});
