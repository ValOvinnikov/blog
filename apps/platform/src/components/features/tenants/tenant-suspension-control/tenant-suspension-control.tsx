'use client';

import type { TMaybeUndefined } from '@blog/config';
import { TENANT_STATUS, type TSuspensionStatus } from '@blog/db/constants';
import type { TOpenTenantSuspension } from '@blog/db/queries/tenant-suspensions';
import { errorResult } from '@blog/utils';
import { BlockOwnerFields } from '@platform/components/features/tenants/tenant-suspension-control/components/block-owner-fields/block-owner-fields';
import { SuspensionCaseDetails } from '@platform/components/features/tenants/tenant-suspension-control/components/suspension-case-details/suspension-case-details';
import { SuspensionCaseFields } from '@platform/components/features/tenants/tenant-suspension-control/components/suspension-case-fields/suspension-case-fields';
import { Card } from '@platform/components/shared/card';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  liftTenantSuspensionAction,
  suspendTenantAction,
} from '@platform/server/tenants/tenant-suspension-actions';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import { useTenantLifecycleAction } from '@platform/utils/use-tenant-lifecycle-action/use-tenant-lifecycle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { tenantSuspensionControlVariants } from './tenant-suspension-control-variants';
import { useSuspensionForm } from './use-suspension-form';

export type TTenantSuspensionControlProps = {
  tenant: Pick<TClientTenant, 'id' | 'name' | 'status'>;
  suspension: TMaybeUndefined<TOpenTenantSuspension>;
};

export const TenantSuspensionControl = ({
  tenant,
  suspension,
}: TTenantSuspensionControlProps) => {
  const t = useTranslations('tenantSuspensionControl');
  const router = useRouter();
  const suspendTenant = useTenantLifecycleAction(
    suspendTenantAction,
    'suspendFailed',
  );
  const liftSuspension = useTenantLifecycleAction(
    liftTenantSuspensionAction,
    'liftSuspensionFailed',
  );
  const {
    caseFields,
    blockFields,
    suspensionCase,
    ownerEmailBlock,
    isComplete,
    reset,
  } = useSuspensionForm();
  const { id, name, status } = tenant;
  const isSuspended = status === TENANT_STATUS.SUSPENDED;
  const copyKey: TSuspensionStatus = isSuspended
    ? TENANT_STATUS.SUSPENDED
    : TENANT_STATUS.ACTIVE;

  const confirm = async () => {
    if (isSuspended) return liftSuspension(id);
    if (!suspensionCase) return errorResult();
    return suspendTenant(id, suspensionCase, ownerEmailBlock);
  };

  const { content } = tenantSuspensionControlVariants();

  return (
    <Card>
      <Card.Header title={t('cardTitle')} />
      <Card.Body>
        <div className={content()}>
          <Text variant="muted">{t(`${copyKey}.description`)}</Text>

          {isSuspended && suspension && (
            <SuspensionCaseDetails suspension={suspension} />
          )}

          <ConfirmDialog
            tone={isSuspended ? BUTTON_VARIANT.PRIMARY : BUTTON_VARIANT.DANGER}
            onConfirm={confirm}
            onConfirmed={() => router.refresh()}
            onOpenChange={reset}
          >
            <ConfirmDialog.Trigger>
              {t(`${copyKey}.triggerButton`)}
            </ConfirmDialog.Trigger>
            <ConfirmDialog.Content
              title={t(`${copyKey}.dialogTitle`, { name })}
              description={t(`${copyKey}.dialogDescription`)}
              confirmButtonLabel={t(`${copyKey}.confirmButton`)}
              confirmingButtonLabel={t(`${copyKey}.confirmingButton`)}
              isConfirmDisabled={!isSuspended && !isComplete}
            >
              {!isSuspended && (
                <>
                  <SuspensionCaseFields {...caseFields} />
                  <BlockOwnerFields {...blockFields} />
                </>
              )}
            </ConfirmDialog.Content>
          </ConfirmDialog>
        </div>
      </Card.Body>
    </Card>
  );
};
