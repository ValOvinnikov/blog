import { SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import { noop } from '@blog/utils/primitives';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { lookSampleFormVariants } from './look-sample-form-variants';

export const LookSampleForm = () => {
  const t = useTranslations('lookPreview');
  const inputId = useId();
  const { root, label, row, field } = lookSampleFormVariants();
  const fieldLabel = t('formFieldLabel');

  return (
    <div className={root()}>
      <label htmlFor={inputId} className={label()}>
        {fieldLabel}
      </label>
      <div className={row()}>
        <SamplePart part={SAMPLE_PART.FORM_FIELD} className={field()}>
          <TextInput
            id={inputId}
            type="email"
            value=""
            onChange={noop}
            ariaLabel={fieldLabel}
            placeholder={t('formFieldPlaceholder')}
          />
        </SamplePart>
        <SamplePart part={SAMPLE_PART.ACTION_BUTTON}>
          <Button type="button" size={SIZE.SM}>
            {t('subscribeButton')}
          </Button>
        </SamplePart>
      </div>
    </div>
  );
};
