import { ExportSubscribersButton } from '@platform/components/features/subscribers/export-subscribers-button';
import { SendingSettingCard } from '@platform/components/features/subscribers/sending-setting-card';
import { SubscriberLimitCards } from '@platform/components/features/subscribers/subscriber-limit-cards';
import { SubscribersEmptyCard } from '@platform/components/features/subscribers/subscribers-empty-card';
import { SubscribersList } from '@platform/components/features/subscribers/subscribers-list';
import { SubscribersNotice } from '@platform/components/features/subscribers/subscribers-notice';
import { PageHeader } from '@platform/components/shared/page-header';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import {
  loadSubscribersPage,
  type TSubscribersPageQuery,
} from '@platform/server/subscribers/load-subscribers-page';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import { getTranslations } from 'next-intl/server';

import { subscribersPageContentVariants } from './subscribers-page-content-variants';

export type TSubscribersPageContentProps = TSubscribersPageQuery & {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
  studioPagesHref: string;
};

export const SubscribersPageContent = async ({
  tenant,
  viewer,
  studioPagesHref,
  ...query
}: TSubscribersPageContentProps) => {
  const [data, t] = await Promise.all([
    loadSubscribersPage(tenant, query),
    getTranslations('subscribersPage'),
  ]);
  const { list, emailNewPosts, offer } = data;
  const { total } = list;
  const isEmpty = total === 0;

  return (
    <div className={subscribersPageContentVariants()}>
      <PageHeader
        title={t('title')}
        description={isEmpty ? t('leadEmpty') : t('lead', { count: total })}
        actions={
          <ExportSubscribersButton tenantId={tenant.id} isEmpty={isEmpty} />
        }
        isActionsFullWidthBelowMd={true}
      />
      <SubscribersNotice
        data={data}
        moveUp={
          viewer.isOwner && offer
            ? {
                tenantId: tenant.id,
                offer,
                publishableKey: stripeEnv.STRIPE_PUBLISHABLE_KEY,
              }
            : undefined
        }
      />
      <SubscriberLimitCards data={data} isEmpty={isEmpty} />
      {isEmpty ? (
        <SubscribersEmptyCard studioPagesHref={studioPagesHref} />
      ) : (
        <>
          <SendingSettingCard
            tenantId={tenant.id}
            isInitiallyOn={emailNewPosts}
          />
          <SubscribersList tenantId={tenant.id} data={data} />
        </>
      )}
    </div>
  );
};
