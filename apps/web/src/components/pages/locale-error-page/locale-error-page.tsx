'use client';

import { routes } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { LinkButton } from '@shinefold/ui/components/molecules/link-button';
import {
  ErrorPageLayout,
  type TErrorPageProps,
} from '@web/components/shared/error-page-layout';
import { SmartLink } from '@web/components/shared/smart-link';
import { VoiceRichText } from '@web/components/shared/voice-rich-text';
import { ERROR_BOUNDARY_LOG } from '@web/constants/error-boundary';
import { useVoiceRich } from '@web/context/voice-rich-provider';
import { useErrorPageAnnouncement } from '@web/hooks/use-error-page-announcement';
import { useTranslations } from 'next-intl';

/** An error thrown by `[tenant]/[locale]/layout.tsx` itself reaches `GlobalErrorPage`, not this boundary. */
export const LocaleErrorPage = ({ error, reset }: TErrorPageProps) => {
  const t = useTranslations('localeErrorPage');
  const description = useVoiceRich('localeErrorDescription');
  const { mainRef, announcementRef } = useErrorPageAnnouncement({
    error,
    logEvent: ERROR_BOUNDARY_LOG.LOCALE_RENDER_FAILED,
    announcement: t('announcement'),
  });

  return (
    <ErrorPageLayout
      title={t('title')}
      mainRef={mainRef}
      announcementRef={announcementRef}
      actions={
        <>
          <Button onClick={reset}>{t('retry')}</Button>
          <LinkButton as={SmartLink} href={routes.home()} variant="ghost">
            {t('goHome')}
          </LinkButton>
        </>
      }
    >
      <VoiceRichText value={description} />
    </ErrorPageLayout>
  );
};
