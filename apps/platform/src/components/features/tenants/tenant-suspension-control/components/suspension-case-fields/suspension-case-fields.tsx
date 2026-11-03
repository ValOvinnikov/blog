'use client';

import {
  SUSPENSION_CATEGORY,
  type TSuspensionCategory,
} from '@blog/db/constants';
import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import { Textarea } from '@platform/components/shared/textarea';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const suspensionCaseFieldsVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
  },
});

const CATEGORIES = Object.values(SUSPENSION_CATEGORY);

export type TSuspensionCaseFieldsProps = {
  category: TSuspensionCategory | '';
  onCategoryChange: (category: TSuspensionCategory) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
};

export const SuspensionCaseFields = ({
  category,
  onCategoryChange,
  description,
  onDescriptionChange,
}: TSuspensionCaseFieldsProps) => {
  const t = useTranslations('tenantSuspensionControl.caseFields');
  const tCategory = useTranslations('suspensionCategory');
  const { root } = suspensionCaseFieldsVariants();

  return (
    <div className={root()}>
      <FormField label={t('categoryLabel')}>
        <OptionSelect<TSuspensionCategory | ''>
          options={CATEGORIES.map((value) => ({
            value,
            label: tCategory(value),
          }))}
          value={category}
          onChange={(next) => {
            if (next) onCategoryChange(next);
          }}
          aria={{ label: t('categoryLabel') }}
          placeholder={t('categoryPlaceholder')}
        />
      </FormField>
      <FormField label={t('descriptionLabel')} hint={t('descriptionHint')}>
        <Textarea value={description} onChange={onDescriptionChange} rows={4} />
      </FormField>
    </div>
  );
};
