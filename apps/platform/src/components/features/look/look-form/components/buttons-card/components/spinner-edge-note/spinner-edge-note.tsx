import { Field } from '@base-ui/react/field';
import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { useTranslations } from 'next-intl';

import { spinnerEdgeNoteVariants } from './spinner-edge-note-variants';

export const SpinnerEdgeNote = () => {
  const t = useTranslations('lookForm');

  return (
    <Field.Description className={spinnerEdgeNoteVariants()}>
      <Icon name={ICONS.INFO} />
      <span>{t('spinnerEdgeNote')}</span>
    </Field.Description>
  );
};
