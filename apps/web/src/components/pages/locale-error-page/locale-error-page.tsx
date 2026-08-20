'use client';

import { routes } from '@blog/config';
import { Button, Heading, Text } from '@blog/ui/atoms';
import { LinkButton } from '@blog/ui/molecules';
import { errorPageLayoutVariants } from '@web/components/shared/error-page-layout';
import { SmartLink } from '@web/components/shared/smart-link';
import { reportClientError } from '@web/utils/report-client-error';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export type TLocaleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageLayoutVariants();

/**
 * Rendered by `[locale]/error.tsx` — sits below `NextIntlClientProvider`, so
 * unlike `ErrorPage`/`GlobalErrorPage` (which sit above it and stay
 * hardcoded English) this one can translate its copy, and "Go home" can use
 * `SmartLink` (its locale awareness needs that same provider). It catches
 * errors thrown anywhere in the localized route tree; `app/error.tsx` still
 * handles the narrower case of `[locale]/layout.tsx` itself throwing, which
 * a boundary nested inside that layout can't reach.
 */
export function LocaleErrorPage({ error, reset }: TLocaleErrorPageProps) {
  const t = useTranslations('localeErrorPage');
  const announcementRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const reportedErrorRef = useRef<Error | null>(null);

  useEffect(() => {
    // Guarded on the error identity itself, not effect re-entry — `t` must
    // stay a real dependency for the announcement below, but its identity
    // isn't ours to rely on for "did the error actually change".
    if (reportedErrorRef.current !== error) {
      reportedErrorRef.current = error;
      reportClientError('locale_error_boundary.render_failed', error, {
        digest: error.digest,
      });
    }
    // Written after mount, not on first paint — a live region that's
    // already populated when it enters the DOM is unreliably announced.
    if (announcementRef.current) {
      announcementRef.current.textContent = t('title');
    }
    mainRef.current?.focus();
  }, [error, t]);

  return (
    <main ref={mainRef} tabIndex={-1} className={s.root()}>
      <span
        ref={announcementRef}
        aria-live="assertive"
        aria-atomic="true"
        className={s.announcement()}
      />
      <Heading level={1} visual="hero">
        {t('title')}
      </Heading>
      <Text className={s.copy()}>{t('description')}</Text>
      <div className={s.actions()}>
        <Button onClick={reset}>{t('retry')}</Button>
        <LinkButton as={SmartLink} href={routes.home()} variant="ghost">
          {t('goHome')}
        </LinkButton>
      </div>
    </main>
  );
}
