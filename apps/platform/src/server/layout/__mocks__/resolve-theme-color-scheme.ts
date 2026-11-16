import type { TColorScheme, TMaybeUndefined } from '@shinefold/config';

export const resolveThemeColorScheme = vi.fn(
  async (): Promise<TMaybeUndefined<TColorScheme>> => undefined,
);
