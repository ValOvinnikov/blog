import type { THeadingBlock } from '@blog/config';

export const MOCK_LATEST_POSTS_HEADING = 'Latest posts';

export const MOCK_LATEST_POSTS_SUPPORTING_TEXT =
  'Fresh from the blog, updated weekly.';

export const mockHeadingBlock = (
  overrides: Partial<THeadingBlock> = {},
): THeadingBlock => ({
  heading: 'Heading',
  supportingText: undefined,
  ...overrides,
});
