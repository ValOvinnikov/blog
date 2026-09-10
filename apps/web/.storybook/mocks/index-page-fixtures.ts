import type { TResult } from '@blog/utils';

/**
 * Shared shape behind every `get{X}IndexPage` Storybook mock: selects
 * between a hero and a plain-heading fixture by the `tenant` arg each
 * story already passes in, matching the real loader's `(tenant) =>
 * TResult<TPage | undefined>` signature.
 */
export const makeIndexPageLoader =
  <TPage>({ withHero, withoutHero }: { withHero: TPage; withoutHero: TPage }) =>
  async (tenant: string): Promise<TResult<TPage | undefined>> => ({
    ok: true,
    data: tenant === 'tenant-with-hero' ? withHero : withoutHero,
  });
