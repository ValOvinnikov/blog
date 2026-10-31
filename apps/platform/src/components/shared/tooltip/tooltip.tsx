import { Tooltip as BaseTooltip } from '@base-ui/react/tooltip';
import type { TCompoundComponent } from '@platform/lib/react';
import type { ComponentProps, ElementType, ReactElement } from 'react';

import { tooltipVariants } from './tooltip-variants';

type TPositionerProps = ComponentProps<typeof BaseTooltip.Positioner>;

type TTooltipProps = {
  label: string;
  trigger: ReactElement;
  side?: TPositionerProps['side'];
  align?: TPositionerProps['align'];
  sideOffset?: number;
};

const TooltipParts = {
  Provider: BaseTooltip.Provider,
} satisfies Record<string, ElementType>;

const TooltipRoot = ({
  label,
  trigger,
  side = 'bottom',
  align = 'start',
  sideOffset = 6,
}: TTooltipProps) => (
  <BaseTooltip.Root>
    <BaseTooltip.Trigger render={trigger} />
    <BaseTooltip.Portal>
      <BaseTooltip.Positioner side={side} align={align} sideOffset={sideOffset}>
        <BaseTooltip.Popup aria-hidden="true" className={tooltipVariants()}>
          {label}
        </BaseTooltip.Popup>
      </BaseTooltip.Positioner>
    </BaseTooltip.Portal>
  </BaseTooltip.Root>
);

export const Tooltip: TCompoundComponent<
  typeof TooltipRoot,
  typeof TooltipParts
> = Object.assign(TooltipRoot, TooltipParts);
