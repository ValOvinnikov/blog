'use client';

import {
  ACTION_OUTCOME,
  ALERT_TYPE,
  SIZE,
  type TFieldErrors,
  type TMaybeUndefined,
} from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { Alert } from '@platform/components/shared/alert';
import { ConfirmDialog } from '@platform/components/shared/confirm-dialog';
import { FormField } from '@platform/components/shared/form-field';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { Text } from '@platform/components/shared/text';
import { Textarea } from '@platform/components/shared/textarea';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import type { TReleaseFieldError } from '@platform/constants/release';
import { startReleaseAction } from '@platform/server/releases/start-release-action';
import type { TReleaseMigrationSummary } from '@platform/server/releases/summarise-release-migrations';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { releaseFailureKey } from './release-failure-key';

type TReleaseFieldErrors = TFieldErrors<
  'version' | 'overrideReason',
  TReleaseFieldError
>;

export type TStartReleaseDialogProps = {
  lastTag: string;
  migrations: TReleaseMigrationSummary;
  isOverrideRequired: boolean;
  disabledReason: TMaybeUndefined<string>;
  onStarted: (startedAt: number) => void;
};

export const StartReleaseDialog = ({
  lastTag,
  migrations,
  isOverrideRequired,
  disabledReason,
  onStarted,
}: TStartReleaseDialogProps) => {
  const t = useTranslations('startReleaseDialog');
  const [version, setVersion] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [fieldErrors, setFieldErrors] = useState<TReleaseFieldErrors>({});
  const { contentMigrations, tenants, dbMigrations, isLowerBound } = migrations;
  const fieldError = (field: keyof TReleaseFieldErrors) => {
    const failure = fieldErrors[field];
    return failure && t(`fieldError.${failure.reason}`, failure.values);
  };

  const handleConfirm = async () => {
    const startedAt = Date.now();
    setFieldErrors({});
    const result = await startReleaseAction({
      version,
      overrideReason: isOverrideRequired ? overrideReason : undefined,
    });

    if (result.outcome === ACTION_OUTCOME.SUCCESS) {
      onStarted(startedAt);
      return okResult();
    }
    if (
      result.outcome === ACTION_OUTCOME.INVALID &&
      Object.keys(result.fieldErrors).length > 0
    ) {
      setFieldErrors(result.fieldErrors);
      return errorResult();
    }
    return errorResult(t(releaseFailureKey(result)));
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) return;
    setVersion('');
    setOverrideReason('');
    setFieldErrors({});
  };

  return (
    <ConfirmDialog
      tone={isOverrideRequired ? BUTTON_VARIANT.DANGER : BUTTON_VARIANT.PRIMARY}
      onConfirm={handleConfirm}
      onOpenChange={handleOpenChange}
    >
      <ConfirmDialog.Trigger
        size={SIZE.SM}
        focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
        disabledReason={disabledReason}
      >
        {isOverrideRequired ? t('overrideTrigger') : t('trigger')}
      </ConfirmDialog.Trigger>
      <ConfirmDialog.Content
        title={t('title')}
        description={t('description')}
        confirmButtonLabel={t('confirm')}
        confirmingButtonLabel={t('confirming')}
        isConfirmDisabled={
          !version.trim() || (isOverrideRequired && !overrideReason.trim())
        }
      >
        {isOverrideRequired && (
          <Alert
            type={ALERT_TYPE.WARNING}
            title={t('overrideTitle')}
            description={t('overrideDescription')}
          />
        )}
        <FormTextInput
          label={t('versionLabel')}
          hint={t('versionHint', { lastTag })}
          error={fieldError('version')}
          value={version}
          onChange={setVersion}
        />
        <Text>
          {t(isLowerBound ? 'migrationsMinimum' : 'migrations', {
            contentMigrations,
            tenants,
            dbMigrations,
          })}
        </Text>
        {isOverrideRequired && (
          <FormField
            label={t('reasonLabel')}
            hint={t('reasonHint')}
            error={fieldError('overrideReason')}
          >
            <Textarea
              rows={3}
              value={overrideReason}
              onChange={setOverrideReason}
            />
          </FormField>
        )}
      </ConfirmDialog.Content>
    </ConfirmDialog>
  );
};
