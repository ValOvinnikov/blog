import type { TLocaleIsoCode } from '@blog/config';

type TLiveLanguagePagesParams<TPage extends { language: TLocaleIsoCode }> = {
  pages: readonly TPage[];
  liveLocales: readonly TLocaleIsoCode[];
};

export const toLiveLanguagePages = <
  TPage extends { language: TLocaleIsoCode },
>({
  pages,
  liveLocales,
}: TLiveLanguagePagesParams<TPage>): TPage[] =>
  pages.filter(({ language }) => liveLocales.includes(language));
