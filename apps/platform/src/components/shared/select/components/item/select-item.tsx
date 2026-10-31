import { Select as BaseSelect } from '@base-ui/react/select';
import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import type { ReactNode } from 'react';

export type TSelectItemProps = {
  value: string;
  children: ReactNode;
};

export const SelectItem = ({ value, children }: TSelectItemProps) => {
  const { item, indicator } = selectVariants();

  return (
    <BaseSelect.Item value={value} className={item()}>
      <span className={indicator()}>
        <BaseSelect.ItemIndicator>
          <Icon name={ICONS.CHECK} />
        </BaseSelect.ItemIndicator>
      </span>
      {children}
    </BaseSelect.Item>
  );
};
