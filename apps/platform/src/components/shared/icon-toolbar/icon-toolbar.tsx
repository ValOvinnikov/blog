'use client';

import { Toolbar } from '@base-ui/react/toolbar';
import {
  IconToggleGroup,
  type TIconToggleGroupProps,
} from '@platform/components/shared/icon-toggle-group';
import {
  getToolbarStopId,
  ToolbarTabStopProvider,
} from '@platform/components/shared/toolbar-tab-stop';
import { Tooltip } from '@platform/components/shared/tooltip';
import type { PropsWithChildren } from 'react';

import { focusToolbarEdge } from './focus-toolbar-edge';
import { iconToolbarVariants } from './icon-toolbar-variants';

export type TIconToolbarProps = PropsWithChildren<{
  ariaLabel: string;
  groups: TIconToggleGroupProps<string>[];
  isEndOnOwnLine?: boolean;
  className?: string;
}>;

export const IconToolbar = ({
  ariaLabel,
  groups,
  isEndOnOwnLine = false,
  children,
  className,
}: TIconToolbarProps) => {
  const { root, endSlot } = iconToolbarVariants({ isEndOnOwnLine });
  const [firstGroup] = groups;
  const defaultStopId = firstGroup
    ? getToolbarStopId(firstGroup.ariaLabel, firstGroup.value)
    : undefined;
  const resetKey = groups.map((group) => group.ariaLabel).join('\n');

  return (
    <Tooltip.Provider>
      <ToolbarTabStopProvider defaultStopId={defaultStopId} resetKey={resetKey}>
        <Toolbar.Root
          loopFocus={false}
          onKeyDown={focusToolbarEdge}
          aria-label={ariaLabel}
          className={root({ class: className })}
        >
          {groups.map((group) => (
            <IconToggleGroup key={group.ariaLabel} {...group} />
          ))}
          {children && <span className={endSlot()}>{children}</span>}
        </Toolbar.Root>
      </ToolbarTabStopProvider>
    </Tooltip.Provider>
  );
};
