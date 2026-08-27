'use client';

import { VoiceFieldGroup } from '@admin/components/features/voice/voice-field-group';
import { Alert } from '@admin/components/shared/alert';
import { Button } from '@admin/components/shared/button';
import { Card } from '@admin/components/shared/card';
import { Disclosure } from '@admin/components/shared/disclosure';
import { PageHeader } from '@admin/components/shared/page-header';
import { useToast } from '@admin/context/toast-provider';
import { inheritedVoiceValue } from '@admin/utils/inherited-voice-value/inherited-voice-value';
import { useFormSubmission } from '@admin/utils/use-form-submission/use-form-submission';
import {
  VOICE_FIELD_GROUPS,
  VOICE_OVERRIDE_KEYS,
  type TVoiceOverrideKey,
  type TVoiceOverrides,
} from '@admin/utils/voice-fields/voice-fields';
import { ALERT_TYPE } from '@blog/config';
import type { TVoicePack } from '@blog/config/constants';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { voiceSettingsVariants } from './voice-settings-variants';

export type TVoiceSettingsProps = {
  tenantSlug: string;
  voicePack: TVoicePack;
  /** The tenant's saved `site_config.voiceOverrides` — matches its `Record<string, string>` JSONB shape directly rather than a narrower curated-key type, so the server component can pass it straight through. */
  initialOverrides: Record<string, string>;
  saveAction: (
    tenantSlug: string,
    overrides: TVoiceOverrides,
  ) => Promise<{ ok: boolean }>;
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
 * default voice), Advanced holds all 19 curated overrides. Every field is
 * blank-means-inherit — its placeholder shows the active preset's voice-pack
 * value, and saving sends the raw (possibly blank) strings straight through;
 * `upsertSiteConfig`'s own Zod schema is what turns a blank entry into an
 * absent JSONB key rather than a stored empty string.
 */
export const VoiceSettings = ({
  tenantSlug,
  voicePack,
  initialOverrides,
  saveAction,
}: TVoiceSettingsProps) => {
  const t = useTranslations('voiceSettings');
  const tGroups = useTranslations('voiceFieldGroups');
  const tLabels = useTranslations('voiceFieldLabels');
  const toast = useToast();
  const router = useRouter();
  const { values, setValues, status, isPending, handleSubmit } =
    useFormSubmission<TVoiceOverrides, { ok: boolean }>({
      initialValues: () => buildInitialValues(initialOverrides),
      onSubmit: (vals) => saveAction(tenantSlug, vals),
      onSuccess: () => {
        toast.success({
          command: 'voice',
          state: 'saved',
          message: t('alertSuccess'),
        });
        router.refresh();
      },
    });

  const placeholders = useMemo(() => {
    const result: Partial<Record<TVoiceOverrideKey, string>> = {};
    for (const key of VOICE_OVERRIDE_KEYS) {
      result[key] = inheritedVoiceValue(voicePack, key);
    }
    return result;
  }, [voicePack]);

  const { root, alert, advancedBody } = voiceSettingsVariants();

  const handleFieldChange = (key: TVoiceOverrideKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className={root()}>
      <PageHeader
        title={t('heading')}
        description={t('description')}
        actions={
          <Button
            variant="primary"
            onClick={handleSubmit}
            isDisabled={isPending}
          >
            {t('saveButton')}
          </Button>
        }
      />

      {status === 'error' && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t('alertError')}
          className={alert()}
        />
      )}

      <Card>
        <Card.Header title={t('basicHeading')} />
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
              placeholders={placeholders}
              onFieldChange={handleFieldChange}
              isDisabled={isPending}
            />
          ))}
        </div>
      </Disclosure>
    </div>
  );
};
