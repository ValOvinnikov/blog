'use client';

import { ALERT_TYPE } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { VoiceFieldGroup } from '@platform/components/features/voice/voice-field-group';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useToast } from '@platform/context/toast-provider';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import {
  VOICE_FIELD_GROUPS,
  VOICE_OVERRIDE_KEYS,
  type TVoiceOverrideKey,
  type TVoiceOverrides,
  type TVoiceOverridesByLocale,
} from '@platform/utils/voice-fields/voice-fields';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { voiceSettingsVariants } from './voice-settings-variants';

export type TVoiceSettingsProps = {
  tenantId: string;
  locale: TLocaleIsoCode;
  initialOverrides: Record<string, string>;
  saveAction: (
    tenantId: string,
    overridesByLocale: TVoiceOverridesByLocale,
  ) => Promise<{ ok: boolean }>;
  savedAt?: Date;
  archivedAt?: Date;
};

const buildInitialValues = (
  initialOverrides: Record<string, string>,
): TVoiceOverrides => {
  const values = {} as TVoiceOverrides;
  for (const key of VOICE_OVERRIDE_KEYS) {
    values[key] = initialOverrides[key] ?? '';
  }
  return values;
};

// Blank means inherit: blank strings are sent as-is and `upsertSiteConfig`
// drops them rather than storing an empty string.
export const VoiceSettings = ({
  tenantId,
  locale,
  initialOverrides,
  saveAction,
  savedAt,
  archivedAt,
}: TVoiceSettingsProps) => {
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();
  const t = useTranslations('voiceSettings');
  const tGroups = useTranslations('voiceFieldGroups');
  const tLabels = useTranslations('voiceFieldLabels');
  const toast = useToast();
  const router = useRouter();
  const [savedValues, setSavedValues] = useState(() =>
    buildInitialValues(initialOverrides),
  );
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TVoiceOverrides, { ok: boolean }>({
      initialValues: savedValues,
      onSubmit: (vals) => saveAction(tenantId, { [locale]: vals }),
      onSuccess: (submittedValues) => {
        setSavedValues(submittedValues);
        toast.success({
          message: t('alertSuccess'),
        });
        router.refresh();
      },
    });

  const { advancedBody } = voiceSettingsVariants();
  const changeCount = VOICE_OVERRIDE_KEYS.filter(
    (key) => values[key] !== savedValues[key],
  ).length;

  const handleFieldChange = (key: TVoiceOverrideKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('description')}
      saveButtonLabel={t('saveButton')}
      savingButtonLabel={t('savingButton')}
      onSave={handleSubmit}
      onDiscard={() => setValues(savedValues)}
      changeCount={changeCount}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error'}
      errorTitle={t('alertError')}
      draft={{
        tenantId,
        page: 'voice',
        values,
        savedValues,
        savedAt,
        fields: VOICE_OVERRIDE_KEYS.map((key) => ({
          id: key,
          label: tLabels(key),
          display: (overrides: TVoiceOverrides) => overrides[key],
        })),
        onRestore: setValues,
      }}
    >
      <div data-testid="voice-basic-card">
        <Card>
          <Card.Header title={t('basicHeading')} headingLevel={2} />
          <Card.Body>
            <Alert type={ALERT_TYPE.INFO} title={t('basicAlert')} />
          </Card.Body>
        </Card>
      </div>

      <Disclosure summary={t('advancedSummary')}>
        <div className={advancedBody()}>
          <Alert type={ALERT_TYPE.INFO} title={t('advancedOverrideInfo')} />
          {VOICE_FIELD_GROUPS.map((group) => (
            <VoiceFieldGroup
              key={group.groupKey}
              title={tGroups(group.groupKey)}
              fields={group.fields.map((field) => ({
                ...field,
                label: tLabels(field.key),
              }))}
              values={values}
              placeholders={{}}
              onFieldChange={handleFieldChange}
              isDisabled={isPending}
              isReadOnly={isArchived}
            />
          ))}
        </div>
      </Disclosure>
    </SettingsFormShell>
  );
};
