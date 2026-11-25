import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { LinkButton } from '@platform/components/shared/link-button';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  NO_ACCESS_REASON,
  NO_ACCESS_REASONS,
} from '@platform/constants/no-access';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { isOneOf } from '@shinefold/utils/primitives';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('noAccess');
}

type TProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function NoAccessPage({ searchParams }: TProps) {
  const [{ reason: requestedReason }, t, homeHref, accountEmail] =
    await Promise.all([
      searchParams,
      getTranslations('noAccessPage'),
      resolveHomeHref(),
      getSessionEmail(),
    ]);
  const reason = isOneOf(NO_ACCESS_REASONS, requestedReason)
    ? requestedReason
    : NO_ACCESS_REASON.SITE;

  return (
    <DeadEndView
      badge={{ label: t('badge'), tone: BADGE_TONE.BRAND }}
      title={t(`${reason}.heading`)}
      description={t(`${reason}.description`)}
      action={
        <LinkButton href={homeHref} variant={BUTTON_VARIANT.SECONDARY}>
          {t('backLink')}
        </LinkButton>
      }
      accountEmail={accountEmail}
    />
  );
}
