import { Select as BaseSelect } from '@base-ui/react/select';
import type { CSSProperties, ReactNode } from 'react';

export type TSelectItemTextProps = {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
};

export const SelectItemText = ({
  children,
  style,
  className,
}: TSelectItemTextProps) => (
  <BaseSelect.ItemText style={style} className={className}>
    {children}
  </BaseSelect.ItemText>
);
