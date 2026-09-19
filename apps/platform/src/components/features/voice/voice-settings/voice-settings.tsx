'use client';

import { ALERT_TYPE } from '@blog/config';
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
} from '@platform/utils/voice-fields/voice-fields';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { voiceSettingsVariants } from './voice-settings-variants';

export type TVoiceSettingsProps = {
  tenantId: string;
  /** The tenant's saved `site_config.voiceOverrides`, already projected to plain text by `plainTextVoiceOverrides`. */
  initialOverrides: Record<string, string>;
  saveAction: (
    tenantId: string,
    overrides: TVoiceOverrides,
  ) => Promise<{ ok: boolean }>;
  /** When set, the tenant is archived: Save is disabled and a notice explains why. */
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

/**
 * The Voice tab: Basic is deliberately empty (the preset already decides the
 * default voice), Advanced holds all 8 curated overrides. Every field is
 * blank-means-inherit, and saving sends the raw (possibly blank) strings
 * straight through; `upsertSiteConfig`'s own Zod schema is what turns a
 * blank entry into an absent JSONB key rather than a stored empty string.
 */
export const VoiceSettings = ({
  tenantId,
  initialOverrides,
  saveAction,
  archivedAt,
}: TVoiceSettingsProps) => {
  const isArchived = Boolean(archivedAt);
  const archivedNoticeId = useId();
  const t = useTranslations('voiceSettings');
  const tGroups = useTranslations('voiceFieldGroups');
  const tLabels = useTranslations('voiceFieldLabels');
  const toast = useToast();
  const router = useRouter();
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TVoiceOverrides, { ok: boolean }>({
      initialValues: () => buildInitialValues(initialOverrides),
      onSubmit: (vals) => saveAction(tenantId, vals),
      onSuccess: () => {
        toast.success({
          message: t('alertSuccess'),
        });
        router.refresh();
      },
    });

  const { advancedBody } = voiceSettingsVariants();

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
      isSaveDisabled={isArchived}
      isPending={isPending}
      archivedAt={archivedAt}
      archivedNoticeId={archivedNoticeId}
      hasError={status === 'error'}
      errorTitle={t('alertError')}
    >
      <Card>
        <Card.Header title={t('basicHeading')} headingLevel={2} />
        <Card.Body>
          <Alert type={ALERT_TYPE.INFO} title={t('basicAlert')} />
        </Card.Body>
      </Card>

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
