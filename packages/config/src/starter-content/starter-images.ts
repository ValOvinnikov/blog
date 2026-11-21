import type { TLocaleIsoCode } from '@shinefold/config/constants';

import { localizedString, reference } from './starter-fields';

export function imageAsset(assetId: string) {
  return { _type: 'image', asset: reference(assetId) } as const;
}

export function localizedImageWithAlt(
  locale: TLocaleIsoCode,
  assetId: string,
  alt: string,
) {
  return {
    _type: 'localizedImageWithAlt',
    asset: reference(assetId),
    alt: localizedString(locale, alt),
  } as const;
}
