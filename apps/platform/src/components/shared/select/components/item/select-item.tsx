import { Select as BaseSelect } from '@base-ui/react/select';
import { ICONS } from '@blog/config';
import { DecorativeGlyph } from '@platform/components/shared/decorative-glyph';
import { Icon } from '@platform/components/shared/icon';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import type { ReactNode } from 'react';

export type TSelectItemProps = {
  value: string;
  glyph?: ReactNode;
  children: ReactNode;
};

export const SelectItem = ({ value, glyph, children }: TSelectItemProps) => {
  const { item, indicator, glyph: glyphSlot } = selectVariants();

  return (
    <BaseSelect.Item value={value} className={item()}>
      <span className={indicator()}>
        <BaseSelect.ItemIndicator>
          <Icon name={ICONS.CHECK} />
        </BaseSelect.ItemIndicator>
      </span>
      <DecorativeGlyph glyph={glyph} className={glyphSlot()} />
      {children}
    </BaseSelect.Item>
  );
};
