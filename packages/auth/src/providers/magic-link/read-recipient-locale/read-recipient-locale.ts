import { LOCALE_BCP47_TAGS, type TLocaleIsoCode } from '@blog/config/constants';

/**
 * The recipient's language is the first segment of the return-to path inside
 * the magic link. That path is visitor-supplied, so it only ever chooses among
 * the tenant's own languages.
 */
export function readRecipientLocale(
  magicLinkUrl: string,
  liveLocales: readonly TLocaleIsoCode[],
  defaultLocale: TLocaleIsoCode,
): TLocaleIsoCode {
  const firstSegment = readCallbackPathFirstSegment(magicLinkUrl);
  if (!firstSegment) return defaultLocale;

  return (
    liveLocales.find((locale) => LOCALE_BCP47_TAGS[locale] === firstSegment) ??
    defaultLocale
  );
}

function readCallbackPathFirstSegment(
  magicLinkUrl: string,
): string | undefined {
  try {
    const callbackUrl = new URL(magicLinkUrl).searchParams.get('callbackUrl');
    if (!callbackUrl) return undefined;

    const [firstSegment] = new URL(callbackUrl, magicLinkUrl).pathname
      .split('/')
      .filter(Boolean);
    return firstSegment?.toLowerCase();
  } catch {
    return undefined;
  }
}
