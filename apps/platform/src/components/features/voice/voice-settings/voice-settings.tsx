'use client';

import { ALERT_TYPE } from '@blog/config';
import type { TVoicePack } from '@blog/config/constants';
import { VoiceFieldGroup } from '@platform/components/features/voice/voice-field-group';
import { Alert } from '@platform/components/shared/alert';
import { ArchivedTenantNotice } from '@platform/components/shared/archived-tenant-notice';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Disclosure } from '@platform/components/shared/disclosure';
import { PageHeader } from '@platform/components/shared/page-header';
import { useToast } from '@platform/context/toast-provider';
import { inheritedVoiceValue } from '@platform/utils/inherited-voice-value/inherited-voice-value';
import { useFormSubmission } from '@platform/utils/use-form-submission/use-form-submission';
import {
  VOICE_FIELD_GROUPS,
  VOICE_OVERRIDE_KEYS,
  type TVoiceOverrideKey,
  type TVoiceOverrides,
} from '@platform/utils/voice-fields/voice-fields';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useMemo } from 'react';

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
            isDisabled={isPending || isArchived}
            aria-describedby={isArchived ? archivedNoticeId : undefined}
          >
            {t('saveButton')}
          </Button>
        }
      />

      {archivedAt && (
        <ArchivedTenantNotice id={archivedNoticeId} archivedAt={archivedAt} />
      )}

      {status === 'error' && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t('alertError')}
          className={alert()}
        />
      )}

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
