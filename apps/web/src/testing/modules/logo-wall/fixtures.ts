import type { TLogoItem } from '@blog/service';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

export const makeLogoItem = (overrides: Partial<TLogoItem> = {}): TLogoItem => {
  const name = overrides.name ?? 'Acme Corp';

  return {
    id: 'logo-1',
    name,
    image: makeSanityImage({ alt: name }),
    link: undefined,
    ...overrides,
  };
};
