import type { THeadingBlock } from '@blog/config';

type THeadingBlockDefaults = {
  heading: string | undefined;
  supportingText: string | undefined;
};

export const makeHeadingBlock = <T extends Partial<THeadingBlock> = object>(
  overrides: T = {} as T,
): THeadingBlockDefaults & T => ({
  heading: 'Latest posts',
  supportingText: undefined,
  ...overrides,
});
