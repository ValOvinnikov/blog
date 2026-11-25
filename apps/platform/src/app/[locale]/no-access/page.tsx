import { HomeDeadEnd } from '@platform/components/features/layout/home-dead-end';
import {
  NO_ACCESS_REASON,
  NO_ACCESS_REASONS,
  NO_ACCESS_SEARCH_PARAM,
} from '@platform/constants/no-access';
import { pageMetadata } from '@platform/server/page-metadata/page-metadata';
import { isOneOf } from '@shinefold/utils/primitives';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata('noAccess');
}

type TProps = {
  searchParams: Promise<{ [NO_ACCESS_SEARCH_PARAM.REASON]?: string }>;
};

export default async function NoAccessPage({ searchParams }: TProps) {
  const [{ [NO_ACCESS_SEARCH_PARAM.REASON]: requestedReason }, t] =
    await Promise.all([searchParams, getTranslations('noAccessPage')]);
  const reason = isOneOf(NO_ACCESS_REASONS, requestedReason)
    ? requestedReason
    : NO_ACCESS_REASON.SITE;

  return (
    <HomeDeadEnd
      badge={t('badge')}
      title={t(`${reason}.heading`)}
      description={t(`${reason}.description`)}
    />
  );
}
