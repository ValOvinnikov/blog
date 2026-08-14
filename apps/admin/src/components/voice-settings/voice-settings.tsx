'use client';

import { VoiceFieldGroup } from '@admin/components/voice-field-group';
import { inheritedVoiceValue } from '@admin/utils/inherited-voice-value/inherited-voice-value';
import {
  VOICE_FIELD_GROUPS,
  VOICE_OVERRIDE_KEYS,
  type TVoiceOverrideKey,
  type TVoiceOverrides,
} from '@admin/utils/voice-fields/voice-fields';
import { ALERT_TYPE } from '@blog/config';
import type { TVoicePack } from '@blog/config/constants';
import { Alert, Button } from '@blog/ui/atoms';
import { useRouter } from 'next/navigation';
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

function buildInitialValues(
  initialOverrides: Record<string, string>,
): TVoiceOverrides {
  const values = {} as TVoiceOverrides;
  for (const key of VOICE_OVERRIDE_KEYS) {
    values[key] = initialOverrides[key] ?? '';
  }
  return values;
}

/**
 * The Voice tab: Basic is deliberately empty (the preset already decides the
 * default voice), Advanced holds all 20 curated overrides. Every field is
 * blank-means-inherit — its placeholder shows the active preset's voice-pack
 * value, and saving sends the raw (possibly blank) strings straight through;
 * `upsertSiteConfig`'s own Zod schema is what turns a blank entry into an
 * absent JSONB key rather than a stored empty string.
 */
export function VoiceSettings({
  tenantSlug,
  voicePack,
  initialOverrides,
  saveAction,
}: TVoiceSettingsProps) {
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
    title,
    description,
    basicCard,
    basicTitle,
    advanced,
    advancedSummary,
    advancedTag,
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
          <h1 className={title()}>Voice</h1>
          <p className={description()}>
            The words the site puts in its own mouth. Your preset already sets
            sensible defaults.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isPending}
          aria-busy={isPending}
        >
          Save changes
        </Button>
      </div>

      {status === 'success' && (
        <Alert
          type={ALERT_TYPE.SUCCESS}
          message="Saved voiceOverrides."
          className={alert()}
        />
      )}
      {status === 'error' && (
        <Alert
          type={ALERT_TYPE.ERROR}
          message="Couldn't save — try again."
          className={alert()}
        />
      )}

      <div className={basicCard()}>
        <h2 className={basicTitle()}>Basic</h2>
        <Alert
          type={ALERT_TYPE.INFO}
          message="Nothing required here. Your preset determines the default voice. Most tenants never open the Advanced fields below."
        />
      </div>

      <details className={advanced()} open={true}>
        <summary className={advancedSummary()}>
          Advanced — 20 curated strings, 4 groups
          <span className={advancedTag()}>optional</span>
        </summary>
        <div className={advancedBody()}>
          <Alert
            type={ALERT_TYPE.INFO}
            message="Every field is an override. Leave one blank to inherit the preset's voice-pack value (shown as the placeholder). Clearing a field reverts to the preset default — it does not set the string to empty."
          />
          {VOICE_FIELD_GROUPS.map((group) => (
            <VoiceFieldGroup
              key={group.title}
              title={group.title}
              fields={group.fields}
              values={values}
              placeholders={placeholders}
              onFieldChange={handleFieldChange}
              disabled={isPending}
            />
          ))}
        </div>
      </details>
    </div>
  );
}
