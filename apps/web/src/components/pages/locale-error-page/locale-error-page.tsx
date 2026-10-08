'use client';

import { routes } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { LinkButton } from '@blog/ui/components/molecules/link-button';
import { errorPageLayoutVariants } from '@web/components/shared/error-page-layout';
import { SmartLink } from '@web/components/shared/smart-link';
import { VoiceRichText } from '@web/components/shared/voice-rich-text';
import { useVoiceRich } from '@web/context/voice-rich-provider';
import { reportClientError } from '@web/utils/report-client-error';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export type TLocaleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageLayoutVariants();

/**
 * Sits below `NextIntlClientProvider`, so unlike `GlobalErrorPage` it can
 * translate its copy and link home with `SmartLink`. An error thrown by
 * `[tenant]/[locale]/layout.tsx` itself goes to `GlobalErrorPage` instead.
 */
export const LocaleErrorPage = ({ error, reset }: TLocaleErrorPageProps) => {
  const t = useTranslations('localeErrorPage');
  const description = useVoiceRich('localeErrorDescription');
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
      announcementRef.current.textContent = t('announcement');
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
      <Text className={s.copy()}>
        <VoiceRichText value={description} />
      </Text>
      <div className={s.actions()}>
        <Button onClick={reset}>{t('retry')}</Button>
        <LinkButton as={SmartLink} href={routes.home()} variant="ghost">
          {t('goHome')}
        </LinkButton>
      </div>
    </main>
  );
};
