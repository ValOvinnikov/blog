import { Select as BaseSelect } from '@base-ui/react/select';
import { ICONS, type TControlAria } from '@blog/config';
import { DecorativeGlyph } from '@platform/components/shared/decorative-glyph';
import { Icon } from '@platform/components/shared/icon';
import { selectVariants } from '@platform/components/shared/select/select-variants';
import {
  SELECT_APPEARANCE,
  type TSelectAppearance,
} from '@platform/constants/select-appearance';
import { useId, type ReactNode } from 'react';

export type TSelectTriggerProps = {
  aria?: TControlAria;
  isLocked?: boolean;
  appearance?: TSelectAppearance;
  glyph?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const SelectTrigger = ({
  aria = {},
  isLocked = false,
  appearance = SELECT_APPEARANCE.DEFAULT,
  glyph,
  children,
  className,
}: TSelectTriggerProps) => {
  const valueId = useId();
  const { label, labelledBy, describedBy } = aria;
  const {
    trigger,
    value,
    icon,
    glyph: glyphSlot,
  } = selectVariants({
    isLocked,
    appearance,
    hasGlyph: Boolean(glyph),
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
        <DecorativeGlyph glyph={glyph} className={glyphSlot()} />
        {children}
      </span>
      <BaseSelect.Icon className={icon()}>
        <Icon
          name={
            appearance === SELECT_APPEARANCE.WIZARD
              ? ICONS.SELECT_CHEVRON
              : ICONS.CHEVRON_DOWN
          }
        />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
};
