import type { TColorScheme, TMaybeUndefined } from '@blog/config';

export const resolveThemeColorScheme = vi.fn(
  async (): Promise<TMaybeUndefined<TColorScheme>> => undefined,
);
