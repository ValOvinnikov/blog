import { ALERT_TYPE } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@platform/components/shared/alert';
import { loadOperatorSuspension } from '@platform/server/tenants/load-operator-suspension';
import { getTranslations } from 'next-intl/server';

import { CopyReferenceButton } from './components/copy-reference-button/copy-reference-button';

export type TOwnerSuspensionBannerProps = {
  tenant: Pick<TTenant, 'id' | 'status' | 'suspensionReason'>;
};

export const OwnerSuspensionBanner = async ({
  tenant,
}: TOwnerSuspensionBannerProps) => {
  const [suspension, t, tCategory] = await Promise.all([
    loadOperatorSuspension(tenant),
    getTranslations('ownerSuspensionBanner'),
    getTranslations('suspensionCategory'),
  ]);

  if (!suspension) return null;

  const { reference, category, description } = suspension;

  return (
    <Alert
      type={ALERT_TYPE.ERROR}
      title={t('title')}
      description={
        <>
          <p>{t('unavailable')}</p>
          <p>{t('category', { category: tCategory(category) })}</p>
          <p>{description}</p>
          <p>{t('contest', { reference })}</p>
        </>
      }
      action={<CopyReferenceButton reference={reference} />}
    />
  );
};
