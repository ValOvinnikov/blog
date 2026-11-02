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
import { tv } from '@platform/utils/tv/tv';
import type { ReactNode } from 'react';

import { focusToolbarEdge } from './focus-toolbar-edge';

const iconToolbarVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center gap-2'],
    spacer: ['flex-1'],
    endSlot: ['inline-flex items-center gap-2'],
  },
});

export type TIconToolbarProps = {
  ariaLabel: string;
  groups: TIconToggleGroupProps<string>[];
  children?: ReactNode;
  className?: string;
};

export const IconToolbar = ({
  ariaLabel,
  groups,
  children,
  className,
}: TIconToolbarProps) => {
  const { root, spacer, endSlot } = iconToolbarVariants();
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
          {children && (
            <>
              <span aria-hidden="true" className={spacer()} />
              <span className={endSlot()}>{children}</span>
            </>
          )}
        </Toolbar.Root>
      </ToolbarTabStopProvider>
    </Tooltip.Provider>
  );
};
