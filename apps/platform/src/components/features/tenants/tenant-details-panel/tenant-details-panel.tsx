'use client';

import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { useUnsavedChangesGuard } from '@platform/context/unsaved-changes-provider';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  lockAllFields,
  type TTenantFieldLocks,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useTranslations } from 'next-intl';
import { useId, useTransition } from 'react';

import { TenantDetailsFields } from './components/tenant-details-fields/tenant-details-fields';
import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';
import { useLockStateChange } from './use-lock-state-change';
import { useTenantDetailsSave } from './use-tenant-details-save';
import { useTenantDetailsValues } from './use-tenant-details-values';

export type TTenantDetailsPanelProps = {
  tenant: TClientTenant;
  fieldLocks: TTenantFieldLocks;
  owner: TMaybeUndefined<TTenantOwnerMembership>;
  archivedNoticeId?: string;
};

export const TenantDetailsPanel = ({
  tenant,
  fieldLocks,
  owner,
  archivedNoticeId,
}: TTenantDetailsPanelProps) => {
  const t = useTranslations('tenantDetailsPanel');
  const panelId = useId();
  const { values, updateField, revertFields, resetValues, changeCount } =
    useTenantDetailsValues(tenant, owner?.email);
  const { fieldErrors, formError, save, clearErrors } = useTenantDetailsSave(
    tenant.id,
    values,
  );
  const [isPending, startTransition] = useTransition();
  const isArchived = Boolean(tenant.deprovisionedAt);
  const isDirty = changeCount > 0;

  const effectiveFieldLocks = isArchived
    ? lockAllFields({ kind: 'archived' })
    : fieldLocks;

  const { lockAnnouncement, fieldsContainerRef } = useLockStateChange({
    panelId,
    fieldLocks: effectiveFieldLocks,
    lockedAnnouncement: t('lockedAnnouncement'),
    unlockedAnnouncement: t('unlockedAnnouncement'),
    onFieldsLocked: revertFields,
  });

  const { root, bodyStack, fields, lockAnnouncementLive, footerActions } =
    tenantDetailsPanelVariants();

  const handleSave = () => {
    startTransition(async () => {
      await save();
    });
  };

  const discard = () => {
    resetValues();
    clearErrors();
  };

  useUnsavedChangesGuard(
    isDirty ? { pageTitle: t('heading'), changeCount, save, discard } : null,
  );

  return (
    <div className={root()} data-tenant-details-panel={panelId}>
      {formError && <Alert type={ALERT_TYPE.ERROR} title={formError} />}

      <Card>
        <Card.Header title={t('heading')} />
        <Card.Body>
          <div className={bodyStack()}>
            <span
              className={lockAnnouncementLive()}
              aria-live="assertive"
              data-testid="lock-announcement-live"
            >
              {lockAnnouncement}
            </span>

            <div
              className={fields()}
              ref={fieldsContainerRef}
              tabIndex={-1}
              role="group"
              aria-label={t('fieldsGroupLabel')}
            >
              <TenantDetailsFields
                values={values}
                fieldLocks={effectiveFieldLocks}
                fieldErrors={fieldErrors}
                onChange={updateField}
              />
            </div>
          </div>
        </Card.Body>

        <Card.Footer>
          <div className={footerActions()}>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isDisabled={!isDirty || isArchived}
              isPending={isPending}
              pendingLabel={t('savingButton')}
              aria-describedby={isArchived ? archivedNoticeId : undefined}
            >
              {t('saveButton')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
};
