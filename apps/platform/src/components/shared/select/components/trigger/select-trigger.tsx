import { Select as BaseSelect } from '@base-ui/react/select';
import { ICONS, type TControlAria } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import { useId, type ReactNode } from 'react';

export type TSelectTriggerProps = {
  aria?: TControlAria;
  isLocked?: boolean;
  children: ReactNode;
  className?: string;
};

export const SelectTrigger = ({
  aria = {},
  isLocked = false,
  children,
  className,
}: TSelectTriggerProps) => {
  const valueId = useId();
  const { label, labelledBy, describedBy } = aria;
  const { trigger, value, icon } = selectVariants({ isLocked });
  // An explicit `undefined` would override the label id Base UI's Field supplies.
  const labelledByProps = labelledBy
    ? { 'aria-labelledby': `${labelledBy} ${valueId}` }
    : {};

  return (
    <BaseSelect.Trigger
      aria-label={label}
      {...labelledByProps}
      aria-describedby={describedBy}
      aria-disabled={isLocked || undefined}
      className={trigger({ class: className })}
    >
      <span id={valueId} className={value()}>
        {children}
      </span>
      <BaseSelect.Icon className={icon()}>
        <Icon name={ICONS.CHEVRON_DOWN} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
};
