'use client';

import { ProvisioningBanner } from '@admin/components/features/tenants/provisioning-banner';
import { useProvisioningPoll } from '@admin/components/features/tenants/provisioning-status-view/use-provisioning-poll';
import { TenantDetailsPanel } from '@admin/components/features/tenants/tenant-details-panel';
import { Card } from '@admin/components/shared/card';
import { DetailList } from '@admin/components/shared/detail-list';
import { LinkButton } from '@admin/components/shared/link-button';
import { PageHeader } from '@admin/components/shared/page-header';
import { StatusBadge } from '@admin/components/shared/status-badge';
import { Text } from '@admin/components/shared/text';
import type { TDomainVerificationStatus } from '@admin/server/provisioning/get-domain-verification-status';
import { formatRelativeTime } from '@admin/utils/format-relative-time/format-relative-time';
import { adminRoutes } from '@admin/utils/routes/routes';
import {
  domainVerificationTone,
  tenantStatusTone,
} from '@admin/utils/status-tone/status-tone';
import { computeTenantFieldLocks } from '@admin/utils/tenant-field-locks/tenant-field-locks';
import { AUDIT_ACTION, Size, type TAuditAction } from '@blog/config';
import type { TAuditEvent } from '@blog/db/schema/audit-events';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

import { tenantOverviewViewVariants } from './tenant-overview-view-variants';

export type TTenantOverviewViewProps = {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
  ownerEmail: string | undefined;
  ownerJoinedAt: string | undefined;
  auditEvents: TAuditEvent[];
};

/**
 * The platform operator's landing page for a single tenant: the
 * provisioning banner, the editable details panel (moved here from the
 * provisioning page), and four read-only fact cards. A single
 * `useProvisioningPoll` instance is lifted up here and shared by the banner
 * and the details panel's field locks, so the two never disagree about
 * provisioning status the way two independent poll instances could.
 */
export const TenantOverviewView = ({
  tenant,
  domainVerificationStatus,
  ownerEmail,
  ownerJoinedAt,
  auditEvents,
}: TTenantOverviewViewProps) => {
  const tTenantsTable = useTranslations('tenantsTable');
  const { root, cardsGrid, cardsColumn } = tenantOverviewViewVariants();
  const {
    provisioningStatus,
    provisioningSteps,
    effectiveProvisioningStatus,
    stepStatuses,
    isOverallFailed,
    isProvisioningRunning,
    errorKind,
  } = useProvisioningPoll(tenant, domainVerificationStatus);

  return (
    <div className={root()}>
      <PageHeader
        title={tenant.name}
        badges={
          <>
            <StatusBadge tone={tenantStatusTone(tenant.status)}>
              {tTenantsTable(`status.${tenant.status}`)}
            </StatusBadge>
            <StatusBadge tone="plan" hasDot={false}>
              {tTenantsTable(`plan.${tenant.plan}`)}
            </StatusBadge>
          </>
        }
      />

      <ProvisioningBanner
        tenantId={tenant.id}
        provisioningStatus={provisioningStatus}
        stepStatuses={stepStatuses}
        isOverallFailed={isOverallFailed}
        isProvisioningRunning={isProvisioningRunning}
        errorKind={errorKind}
      />

      <TenantDetailsPanel
        tenant={tenant}
        fieldLocks={computeTenantFieldLocks(
          provisioningSteps,
          effectiveProvisioningStatus,
        )}
        ownerEmail={ownerEmail}
      />

      <div className={cardsGrid()}>
        <div className={cardsColumn()}>
          <DomainCard
            tenant={tenant}
            domainVerificationStatus={domainVerificationStatus}
          />
          <OwnerCard ownerEmail={ownerEmail} ownerJoinedAt={ownerJoinedAt} />
        </div>
        <div className={cardsColumn()}>
          <ContentWorkspaceCard tenant={tenant} />
          <RecentActivityCard events={auditEvents} />
        </div>
      </div>
    </div>
  );
};

const DomainCard = ({
  tenant,
  domainVerificationStatus,
}: {
  tenant: TTenant;
  domainVerificationStatus: TDomainVerificationStatus;
}) => {
  const t = useTranslations('tenantOverviewPage');

  return (
    <Card>
      <Card.Header
        title={t('domainCardTitle')}
        actions={
          <>
            <StatusBadge
              tone={domainVerificationTone(domainVerificationStatus)}
            >
              {t(`dnsStatus.${domainVerificationStatus}`)}
            </StatusBadge>
            <LinkButton
              href={adminRoutes.tenantProvisioning(tenant.id)}
              variant="ghost"
              size={Size.SM}
            >
              {t('dnsLinkButton')}
            </LinkButton>
          </>
        }
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('publicDomainLabel')} isMono={true}>
            {tenant.primaryDomain}
          </DetailList.Row>
          <DetailList.Row label={t('lastCheckedLabel')}>
            {t('lastCheckedJustNow')}
          </DetailList.Row>
        </DetailList>
      </Card.Body>
    </Card>
  );
};

const OwnerCard = ({
  ownerEmail,
  ownerJoinedAt,
}: {
  ownerEmail: string | undefined;
  ownerJoinedAt: string | undefined;
}) => {
  const t = useTranslations('tenantOverviewPage');

  return (
    <Card>
      <Card.Header title={t('ownerCardTitle')} />
      <Card.Body>
        <DetailList>
          <DetailList.Row
            label={t('emailLabel')}
            isMono={true}
            action={
              !ownerEmail && (
                <StatusBadge tone="warn">
                  {t('ownerInvitedPendingBadge')}
                </StatusBadge>
              )
            }
          >
            {ownerEmail ?? '—'}
          </DetailList.Row>
          <DetailList.Row label={t('roleLabel')}>
            <StatusBadge tone="neutral">{t('ownerRoleBadge')}</StatusBadge>
          </DetailList.Row>
          {ownerJoinedAt && (
            <DetailList.Row label={t('joinedLabel')}>
              {ownerJoinedAt}
            </DetailList.Row>
          )}
        </DetailList>
      </Card.Body>
    </Card>
  );
};

const ContentWorkspaceCard = ({ tenant }: { tenant: TTenant }) => {
  const t = useTranslations('tenantOverviewPage');
  const studioHost = `studio-${tenant.slug}.valstack.dev`;

  return (
    <Card>
      <Card.Header
        title={t('contentWorkspaceCardTitle')}
        actions={
          <StatusBadge tone="neutral" hasDot={false}>
            {t('platformBadge')}
          </StatusBadge>
        }
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('sanityProjectLabel')} isMono={true}>
            {tenant.sanityProjectId ?? t('notSetValue')}
          </DetailList.Row>
          <DetailList.Row label={t('datasetLabel')} isMono={true}>
            {tenant.sanityDataset ?? t('notSetValue')}
          </DetailList.Row>
          <DetailList.Row label={t('studioLabel')} isMono={true}>
            {studioHost}
          </DetailList.Row>
          <DetailList.Row label={t('readTokenLabel')}>
            <StatusBadge
              tone={tenant.sanityReadTokenEncrypted ? 'ok' : 'neutral'}
            >
              {tenant.sanityReadTokenEncrypted
                ? t('readTokenStored')
                : t('readTokenNotSet')}
            </StatusBadge>
          </DetailList.Row>
          <DetailList.Row label={t('revalidateHookLabel')}>
            <StatusBadge tone={tenant.webhookCreatedAt ? 'ok' : 'neutral'}>
              {tenant.webhookCreatedAt
                ? t('revalidateHookActive')
                : t('revalidateHookNotSet')}
            </StatusBadge>
          </DetailList.Row>
        </DetailList>
      </Card.Body>
    </Card>
  );
};

const ACTIVITY_GLYPH: Record<TAuditAction, string> = {
  [AUDIT_ACTION.CREATED]: '+',
  [AUDIT_ACTION.ARCHIVED]: '⏸',
  [AUDIT_ACTION.DEPROVISIONED]: '⏻',
  [AUDIT_ACTION.SETTINGS_UPDATED]: '⚙',
  [AUDIT_ACTION.DELETED]: '✕',
};

const RecentActivityCard = ({ events }: { events: TAuditEvent[] }) => {
  const t = useTranslations('tenantOverviewPage');
  const {
    activityList,
    activityRow,
    activityIcon,
    activityBody,
    activityMessage,
    activitySub,
    activityTime,
    activityEmpty,
  } = tenantOverviewViewVariants();

  return (
    <Card>
      <Card.Header
        title={t('recentActivityCardTitle')}
        actions={
          <Text variant="hint" as="span">
            {t('recentActivitySourceLabel')}
          </Text>
        }
      />
      <Card.Body>
        {events.length === 0 ? (
          <p className={activityEmpty()}>{t('activityEmpty')}</p>
        ) : (
          <div className={activityList()}>
            {events.map((event) => (
              <div className={activityRow()} key={event.id}>
                <span className={activityIcon()} aria-hidden="true">
                  {ACTIVITY_GLYPH[event.action]}
                </span>
                <div className={activityBody()}>
                  <span className={activityMessage()}>
                    {t(`activityAction.${event.action}`)}
                  </span>
                  <span className={activitySub()}>{event.actorEmail}</span>
                </div>
                <span className={activityTime()}>
                  {formatRelativeTime(event.createdAt, t)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
