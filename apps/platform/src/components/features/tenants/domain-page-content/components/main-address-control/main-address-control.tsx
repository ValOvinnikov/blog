'use client';

import {
  isOutcomeInvalid,
  isOutcomeRefused,
  isOutcomeSuccess,
  SIZE,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { useCustomDomainFocus } from '@platform/components/features/tenants/domain-page-content/components/custom-domain-focus-provider/use-custom-domain-focus';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import {
  MAIN_ADDRESS_TARGET,
  type TMainAddressTarget,
} from '@platform/constants/custom-domain';
import { makeCustomDomainMainAddressAction } from '@platform/server/custom-domain/make-custom-domain-main-address-action';
import { makeSubdomainMainAddressAction } from '@platform/server/custom-domain/make-subdomain-main-address-action';
import { CUSTOM_DOMAIN_REFUSAL_KEYS } from '@platform/utils/custom-domain-keys/custom-domain-keys';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export type TMainAddressControlProps = {
  tenantId: string;
  domain: string;
  target: TMainAddressTarget;
};

const COPY_KEY = {
  [MAIN_ADDRESS_TARGET.CUSTOM_DOMAIN]: 'makeMain',
  [MAIN_ADDRESS_TARGET.SUBDOMAIN]: 'useSubdomain',
} satisfies Record<TMainAddressTarget, string>;

export const MainAddressControl = ({
  tenantId,
  domain,
  target,
}: TMainAddressControlProps) => {
  const t = useTranslations('tenantDomainPage.ownDomain');
  const router = useRouter();
  const { requestFocus } = useCustomDomainFocus();
  const copyKey = COPY_KEY[target];

  const confirm = async () => {
    const result =
      target === MAIN_ADDRESS_TARGET.CUSTOM_DOMAIN
        ? await makeCustomDomainMainAddressAction(tenantId, { domain })
        : await makeSubdomainMainAddressAction(tenantId);

    if (isOutcomeSuccess(result)) return okResult();
    if (isOutcomeInvalid(result)) return errorResult(t('invalidInput'));
    if (isOutcomeRefused(result)) {
      return errorResult(
        t(`refusal.${CUSTOM_DOMAIN_REFUSAL_KEYS[result.reason]}`),
      );
    }
    return errorResult(t('mainAddress.failed'));
  };

  const handleConfirmed = () => {
    requestFocus();
    router.refresh();
  };

  return (
    <ConfirmDialog
      tone="primary"
      onConfirm={confirm}
      onConfirmed={handleConfirmed}
    >
      <ConfirmDialog.Trigger size={SIZE.SM}>
        {t(`mainAddress.${copyKey}.trigger`)}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t(`mainAddress.${copyKey}.title`)}
        description={t(`mainAddress.${copyKey}.description`, { domain })}
        confirmButtonLabel={t(`mainAddress.${copyKey}.confirm`)}
        confirmingButtonLabel={t(`mainAddress.${copyKey}.confirming`)}
      />
    </ConfirmDialog>
  );
};
