'use client';

import {
  type ACTION_OUTCOME,
  isOutcomeRefused,
  isOutcomeSuccess,
  isOutcomeUnavailable,
  SIZE,
  type TOutcome,
} from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import {
  MIGRATION_ENVIRONMENT,
  RELEASE_REFUSAL,
} from '@platform/constants/release';
import { useToast } from '@platform/context/toast-provider';
import type { TFailedMigrationTenant } from '@platform/server/releases/list-failed-migration-tenants';
import {
  startTenantMigrationsAction,
  type TStartTenantMigrationsResult,
} from '@platform/server/releases/start-tenant-migrations-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';

const REFUSAL_KEYS = {
  [RELEASE_REFUSAL.TENANT_REQUIRED]: 'tenantRequired',
  [RELEASE_REFUSAL.TENANT_MIGRATION_NOT_FAILED]: 'notFailed',
} satisfies Record<
  | typeof RELEASE_REFUSAL.TENANT_REQUIRED
  | typeof RELEASE_REFUSAL.TENANT_MIGRATION_NOT_FAILED,
  string
>;

const failureKey = (
  result: Exclude<
    TStartTenantMigrationsResult,
    TOutcome<typeof ACTION_OUTCOME.SUCCESS>
  >,
) => {
  if (isOutcomeRefused(result)) {
    return REFUSAL_KEYS[result.reason];
  }
  return isOutcomeUnavailable(result)
    ? 'failedTenantsUnavailable'
    : 'startFailed';
};

export type TRunTenantMigrationsButtonProps = {
  retryTenant?: Pick<TFailedMigrationTenant, 'id' | 'name'>;
};

export const RunTenantMigrationsButton = ({
  retryTenant,
}: TRunTenantMigrationsButtonProps) => {
  const t = useTranslations('runTenantMigrationsButton');
  const toast = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await startTenantMigrationsAction(
        retryTenant
          ? {
              environment: MIGRATION_ENVIRONMENT.PRODUCTION,
              tenantId: retryTenant.id,
            }
          : { environment: MIGRATION_ENVIRONMENT.DEVELOPMENT },
      );

      if (isOutcomeSuccess(result)) {
        toast.success({ message: t('started') });
        router.refresh();
        return;
      }

      toast.error({ message: t(failureKey(result)) });
    });
  };

  return (
    <Button
      variant={retryTenant ? BUTTON_VARIANT.SECONDARY : BUTTON_VARIANT.PRIMARY}
      size={SIZE.SM}
      focusGround={
        retryTenant ? FOCUS_RING_GROUND.SURFACE : FOCUS_RING_GROUND.SURFACE_HEAD
      }
      isPending={isPending}
      pendingLabel={t('starting')}
      aria-label={
        retryTenant
          ? t('retryAriaLabel', { tenant: retryTenant.name })
          : undefined
      }
      onClick={handleClick}
    >
      {retryTenant ? t('retryLabel') : t('developmentLabel')}
    </Button>
  );
};
