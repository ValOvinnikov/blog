import { SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import { noop } from '@blog/utils/primitives';
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
        <TextInput
          id={inputId}
          type="email"
          value=""
          onChange={noop}
          ariaLabel={fieldLabel}
          placeholder={t('formFieldPlaceholder')}
          className={field()}
        />
        <Button type="button" size={SIZE.SM}>
          {t('subscribeButton')}
        </Button>
      </div>
    </div>
  );
};
