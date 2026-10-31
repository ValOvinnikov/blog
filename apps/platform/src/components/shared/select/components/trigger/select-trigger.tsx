import { Select as BaseSelect } from '@base-ui/react/select';
import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import { ICON_SIZE } from '@platform/constants/icon';
import type { AriaAttributes, ReactNode } from 'react';

export type TSelectTriggerProps = {
  ariaLabel?: string;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  children: ReactNode;
  className?: string;
};

export const SelectTrigger = ({
  ariaLabel,
  'aria-describedby': ariaDescribedBy,
  children,
  className,
}: TSelectTriggerProps) => {
  const { trigger, icon } = selectVariants();

  return (
    <BaseSelect.Trigger
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={trigger({ class: className })}
    >
      {children}
      <BaseSelect.Icon className={icon()}>
        <Icon name={ICONS.CHEVRON_DOWN} size={ICON_SIZE.MD} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
};
