import type { TOpenTenantSuspension } from '@blog/db/queries/tenant-suspensions';
import { DetailList } from '@platform/components/shared/detail-list';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useLocale, useTranslations } from 'next-intl';

export type TSuspensionCaseDetailsProps = {
  suspension: TOpenTenantSuspension;
};

export const SuspensionCaseDetails = ({
  suspension,
}: TSuspensionCaseDetailsProps) => {
  const t = useTranslations('tenantSuspensionControl.case');
  const tCategory = useTranslations('suspensionCategory');
  const locale = useLocale();
  const { reference, category, description, suspendedByEmail, suspendedAt } =
    suspension;

  return (
    <DetailList>
      <DetailList.Row label={t('referenceLabel')} isMono={true}>
        {reference}
      </DetailList.Row>
      <DetailList.Row label={t('categoryLabel')}>
        {tCategory(category)}
      </DetailList.Row>
      <DetailList.Row label={t('descriptionLabel')}>
        {description}
      </DetailList.Row>
      {suspendedByEmail && (
        <DetailList.Row label={t('suspendedByLabel')} isMono={true}>
          {suspendedByEmail}
        </DetailList.Row>
      )}
      <DetailList.Row label={t('suspendedAtLabel')}>
        <time dateTime={suspendedAt.toISOString()}>
          {formatDate(suspendedAt, locale)}
        </time>
      </DetailList.Row>
    </DetailList>
  );
};
