import { CORE_PROVISIONING_STEPS } from '@blog/db/constants';
import { TenantDetailsForm } from '@platform/components/features/tenants/tenant-details-form';
import { PageHeader } from '@platform/components/shared/page-header';
import {
  WizardRail,
  type TWizardRailStep,
} from '@platform/components/shared/wizard-rail';
import { useTranslations } from 'next-intl';

import { addTenantWizardVariants } from './add-tenant-wizard-variants';

/**
 * The `/tenants/new` page body — the "Add tenant" H1 and the provisioning
 * rail around the Details step, which is the only step an operator interacts
 * with directly; everything after it runs automatically once
 * `TenantDetailsForm` submits, in `CORE_PROVISIONING_STEPS` order, sharing
 * its step titles with `ProvisioningStatusView` so the two can't drift apart.
 */
export const AddTenantWizard = () => {
  const t = useTranslations('addTenantWizard');
  const tProvisioningStatus = useTranslations('provisioningStatusView');
  const { root, layout, body } = addTenantWizardVariants();

  const steps: TWizardRailStep[] = [
    {
      title: t('steps.details.title'),
      description: t('steps.details.description'),
    },
    ...CORE_PROVISIONING_STEPS.map((step) => ({
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
          <TenantDetailsForm />
        </div>
      </div>
    </div>
  );
};
