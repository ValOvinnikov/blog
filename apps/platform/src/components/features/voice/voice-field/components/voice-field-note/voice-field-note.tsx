import { Field } from '@base-ui/react/field';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { useTranslations } from 'next-intl';

import { voiceFieldNoteVariants } from './voice-field-note-variants';

export type TVoiceFieldNoteProps = {
  id: string;
  placeholderToken: string;
};

export const VoiceFieldNote = ({
  id,
  placeholderToken,
}: TVoiceFieldNoteProps) => {
  const t = useTranslations('voiceSettings');
  const { note, token } = voiceFieldNoteVariants();

  return (
    <Field.Description
      id={id}
      render={<span />}
      className={textVariants({ variant: 'hint', class: note() })}
    >
      {t.rich('keepPlaceholder', {
        token: `{${placeholderToken}}`,
        code: (chunks) => <code className={token()}>{chunks}</code>,
      })}
    </Field.Description>
  );
};
