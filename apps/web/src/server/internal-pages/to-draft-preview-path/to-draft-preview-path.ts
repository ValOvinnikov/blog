import type { TLocaleIsoCode } from '@shinefold/config';
import type { TDraftPagePath } from '@shinefold/service';
import { toLocalizedPathname } from '@web/utils/to-localized-pathname';

const PATH_SEPARATOR = '/';

export const toDraftPreviewPath = (
  { href, locale }: TDraftPagePath,
  defaultLocale: TLocaleIsoCode,
): string =>
  toLocalizedPathname({
    href: href
      .split(PATH_SEPARATOR)
      .map(encodeURIComponent)
      .join(PATH_SEPARATOR),
    locale,
    defaultLocale,
  });
