'use client';

import { Button, Heading, Text } from '@blog/ui/atoms';
import { errorPageVariants } from '@web/components/pages/error-page/error-page-variants';
import { reportClientError } from '@web/utils/report-client-error';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

export type TLocaleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageVariants();

/**
 * Rendered by `[locale]/error.tsx` — sits below `NextIntlClientProvider`, so
 * unlike `ErrorPage`/`GlobalErrorPage` (which sit above it and stay
 * hardcoded English) this one can translate its copy. It catches errors
 * thrown anywhere in the localized route tree; `app/error.tsx` still handles
 * the narrower case of `[locale]/layout.tsx` itself throwing, which a
 * boundary nested inside that layout can't reach. Shares `ErrorPage`'s
 * layout classes rather than forking a third identical `*-variants.ts`.
 */
export function LocaleErrorPage({ error, reset }: TLocaleErrorPageProps) {
  const t = useTranslations('localeErrorPage');

  useEffect(() => {
    reportClientError('locale_error_boundary.render_failed', error, {
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className={s.root()}>
      <Heading level={1} visual="hero">
        {t('title')}
      </Heading>
      <Text className={s.copy()}>{t('description')}</Text>
      <div className={s.actions()}>
        <Button onClick={reset}>{t('retry')}</Button>
        <Button variant="ghost" onClick={() => window.location.assign('/')}>
          {t('goHome')}
        </Button>
      </div>
    </main>
  );
}
