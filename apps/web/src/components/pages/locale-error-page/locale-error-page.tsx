'use client';

import { routes, TEXT_ROLE, type TMaybeNull } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { LinkButton } from '@shinefold/ui/components/molecules/link-button';
import { errorPageLayoutVariants } from '@web/components/shared/error-page-layout';
import { SmartLink } from '@web/components/shared/smart-link';
import { VoiceRichText } from '@web/components/shared/voice-rich-text';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { useVoiceRich } from '@web/context/voice-rich-provider';
import { reportClientError } from '@web/utils/report-client-error';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export type TLocaleErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const s = errorPageLayoutVariants();

/** An error thrown by `[tenant]/[locale]/layout.tsx` itself reaches `GlobalErrorPage`, not this boundary. */
export const LocaleErrorPage = ({ error, reset }: TLocaleErrorPageProps) => {
  const t = useTranslations('localeErrorPage');
  const description = useVoiceRich('localeErrorDescription');
  const announcementRef = useRef<HTMLSpanElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const reportedErrorRef = useRef<TMaybeNull<Error>>(null);

  useEffect(() => {
    // `t` can change identity without a new error, so report once per error.
    if (reportedErrorRef.current !== error) {
      reportedErrorRef.current = error;
      reportClientError(ERROR_BOUNDARY_LOG.LOCALE_RENDER_FAILED, error, {
        digest: error.digest,
      });
    }
    // A live region already populated when it mounts is unreliably announced.
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
      <Heading level={1} visual={TEXT_ROLE.HERO_TITLE}>
        {t('title')}
      </Heading>
      <Text textRole={TEXT_ROLE.INTRO} className={s.copy()}>
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
