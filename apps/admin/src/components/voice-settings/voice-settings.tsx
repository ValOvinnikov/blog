'use client';

import { VoiceFieldGroup } from '@admin/components/voice-field-group';
import { inheritedVoiceValue } from '@admin/utils/inherited-voice-value/inherited-voice-value';
import {
  VOICE_FIELD_GROUPS,
  VOICE_OVERRIDE_KEYS,
  type TVoiceOverrideKey,
  type TVoiceOverrides,
} from '@admin/utils/voice-fields/voice-fields';
import { ALERT_TYPE, ICONS, Size } from '@blog/config';
import type { TVoicePack } from '@blog/config/constants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { Icon } from '@blog/ui/atoms/icon';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState, useTransition } from 'react';

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
 * default voice), Advanced holds all 20 curated overrides. Every field is
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
  const router = useRouter();
  const [values, setValues] = useState<TVoiceOverrides>(() =>
    buildInitialValues(initialOverrides),
  );
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  const placeholders = useMemo(() => {
    const result: Partial<Record<TVoiceOverrideKey, string>> = {};
    for (const key of VOICE_OVERRIDE_KEYS) {
      result[key] = inheritedVoiceValue(voicePack, key);
    }
    return result;
  }, [voicePack]);

  const {
    root,
    pagehead,
    description,
    basicCard,
    advanced,
    advancedSummary,
    advancedBody,
    alert,
  } = voiceSettingsVariants();

  const handleFieldChange = (key: TVoiceOverrideKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setStatus('idle');
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await saveAction(tenantSlug, values);
      setStatus(result.ok ? 'success' : 'error');
      if (result.ok) router.refresh();
    });
  };

  return (
    <div className={root()}>
      <div className={pagehead()}>
        <div>
          <Heading level={1} size={Size.MD}>
            {t('heading')}
          </Heading>
          <p className={description()}>{t('description')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          isDisabled={isPending}
          aria-busy={isPending}
        >
          {t('saveButton')}
        </Button>
      </div>

      {status === 'success' && (
        <Alert
          type={ALERT_TYPE.SUCCESS}
          message={t('alertSuccess')}
          className={alert()}
        />
      )}
      {status === 'error' && (
        <Alert
          type={ALERT_TYPE.ERROR}
          message={t('alertError')}
          className={alert()}
        />
      )}

      <div className={basicCard()}>
        <Heading level={2} size={Size.XS}>
          {t('basicHeading')}
        </Heading>
        <Alert type={ALERT_TYPE.INFO} message={t('basicAlert')} />
      </div>

      <details className={advanced()}>
        <summary className={advancedSummary()}>
          <Icon
            name={ICONS.CHEVRON_RIGHT}
            variant="chevronOpen"
            aria-hidden="true"
          />
          {t('advancedSummary')}
        </summary>
        <div className={advancedBody()}>
          <Alert type={ALERT_TYPE.INFO} message={t('advancedOverrideInfo')} />
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
      </details>
    </div>
  );
};
