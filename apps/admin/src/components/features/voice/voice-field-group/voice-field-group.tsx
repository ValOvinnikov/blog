import { VoiceField } from '@admin/components/features/voice/voice-field';
import type {
  TVoiceField,
  TVoiceOverrideKey,
  TVoiceOverrides,
} from '@admin/utils/voice-fields/voice-fields';
import { Size } from '@blog/config';
import { Heading } from '@blog/ui/atoms/heading';
import { SettingRow } from '@blog/ui/molecules/setting-row';
import { useTranslations } from 'next-intl';

import { voiceFieldGroupVariants } from './voice-field-group-variants';

export type TVoiceFieldGroupProps = {
  title: string;
  fields: (TVoiceField & { label: string })[];
  values: TVoiceOverrides;
  placeholders: Partial<Record<TVoiceOverrideKey, string>>;
  onFieldChange: (key: TVoiceOverrideKey, value: string) => void;
  isDisabled?: boolean;
};

/**
 * One curated-voice card: a group heading (matching the CMS schema's
 * fieldset titles) over its member fields, each rendered as a `SettingRow`
 * to match the label + description + control scaffold `look-form` and
 * `features-settings` already use.
 */
export const VoiceFieldGroup = ({
  title,
  fields,
  values,
  placeholders,
  onFieldChange,
  isDisabled = false,
}: TVoiceFieldGroupProps) => {
  const t = useTranslations('voiceFieldGroup');
  const { root, header, headerDescription, body, fieldKey } =
    voiceFieldGroupVariants();

  return (
    <section className={root()}>
      <header className={header()}>
        <Heading level={3} size={Size.XS}>
          {title}
        </Heading>
        <span className={headerDescription()}>
          {t('fieldCount', { count: fields.length })}
        </span>
      </header>
      <div className={body()}>
        {fields.map((field) => (
          <SettingRow
            key={field.key}
            label={
              <>
                {field.label}
                <code className={fieldKey()}>{field.key}</code>
              </>
            }
            labelLevel={4}
            canControlGrow={true}
          >
            <VoiceField
              fieldKey={field.key}
              label={field.label}
              value={values[field.key]}
              onChange={(value) => onFieldChange(field.key, value)}
              placeholder={placeholders[field.key]}
              isMultiline={field.multiline}
              isDisabled={isDisabled}
            />
          </SettingRow>
        ))}
      </div>
    </section>
  );
};
