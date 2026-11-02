import { Select as BaseSelect } from '@base-ui/react/select';
import { ICONS, type TControlAria } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import {
  FIELD_APPEARANCE,
  type TFieldAppearance,
} from '@platform/constants/field-appearance';
import { useId, type ReactNode } from 'react';

export type TSelectTriggerProps = {
  aria?: TControlAria;
  isLocked?: boolean;
  appearance?: TFieldAppearance;
  children: ReactNode;
  className?: string;
};

export const SelectTrigger = ({
  aria = {},
  isLocked = false,
  appearance = FIELD_APPEARANCE.DEFAULT,
  children,
  className,
}: TSelectTriggerProps) => {
  const valueId = useId();
  const { label, labelledBy, describedBy } = aria;
  const { trigger, value, icon } = selectVariants({
    isLocked,
    appearance,
  });
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
        <Icon
          name={
            appearance === FIELD_APPEARANCE.WIZARD
              ? ICONS.SELECT_CHEVRON
              : ICONS.CHEVRON_DOWN
          }
        />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
};
