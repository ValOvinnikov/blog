import type { TMaybeUndefined } from '@blog/config';
import { CORE_PROVISIONING_STEPS } from '@blog/db/constants';
import { TenantDetailsForm } from '@platform/components/features/tenants/tenant-details-form';
import { PageHeader } from '@platform/components/shared/page-header';
import {
  WizardRail,
  type TWizardRailStep,
} from '@platform/components/shared/wizard-rail';
import { useTranslations } from 'next-intl';

import { addTenantWizardVariants } from './add-tenant-wizard-variants';

export type TAddTenantWizardProps = {
  rootDomain: TMaybeUndefined<string>;
};

export const AddTenantWizard = ({ rootDomain }: TAddTenantWizardProps) => {
  const t = useTranslations('addTenantWizard');
  const tProvisioningStatus = useTranslations('provisioningStatusView');
  const { root, layout, body } = addTenantWizardVariants();

  const steps: TWizardRailStep[] = [
    {
      id: 'details',
      title: t('steps.details.title'),
      description: t('steps.details.description'),
    },
    ...CORE_PROVISIONING_STEPS.map((step) => ({
      id: step,
      title: tProvisioningStatus(`stepLabel.${step}`),
      description: t(`stepDescriptions.${step}`),
    })),
  ];

  return (
    <div className={root()}>
      <PageHeader title={t('heading')} />
      <div className={layout()}>
        <WizardRail
          steps={steps}
          activeIndex={0}
          ariaLabel={t('railAriaLabel')}
        />
        <div className={body()}>
          <TenantDetailsForm rootDomain={rootDomain} />
        </div>
      </div>
    </div>
  );
};
