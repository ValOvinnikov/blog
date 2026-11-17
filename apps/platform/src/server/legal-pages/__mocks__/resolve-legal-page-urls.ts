import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import type { TMaybeUndefined } from '@shinefold/config';

export const resolveLegalPageUrls = vi.fn(
  async (urls: TMaybeUndefined<TLegalPageUrls>) => urls,
);
