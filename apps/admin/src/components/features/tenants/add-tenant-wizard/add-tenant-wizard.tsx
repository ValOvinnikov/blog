import { TenantDetailsForm } from '@admin/components/features/tenants/tenant-details-form';
import { PageHeader } from '@admin/components/shared/page-header';
import {
  WizardRail,
  type TWizardRailStep,
} from '@admin/components/shared/wizard-rail';
import { useTranslations } from 'next-intl';

import { addTenantWizardVariants } from './add-tenant-wizard-variants';

/**
 * The `/tenants/new` page body — the "Add tenant" H1 and the six-step
 * provisioning rail around the Details step, which is the only step an
 * operator interacts with directly; everything after it runs automatically
 * once `TenantDetailsForm` submits.
 */
export const AddTenantWizard = () => {
  const t = useTranslations('addTenantWizard');
  const { root, layout, body } = addTenantWizardVariants();

  const steps: TWizardRailStep[] = [
    {
      title: t('steps.details.title'),
      description: t('steps.details.description'),
    },
    {
      title: t('steps.sanityProject.title'),
      description: t('steps.sanityProject.description'),
    },
    {
      title: t('steps.seedContent.title'),
      description: t('steps.seedContent.description'),
    },
    {
      title: t('steps.deployStudio.title'),
      description: t('steps.deployStudio.description'),
    },
    {
      title: t('steps.registryRows.title'),
      description: t('steps.registryRows.description'),
    },
    {
      title: t('steps.mapDomain.title'),
      description: t('steps.mapDomain.description'),
    },
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
