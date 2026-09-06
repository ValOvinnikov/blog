import type { IWithClassName, IWithDataTestId } from '@blog/config';
import {
  mapCompoundSlots,
  type TCompoundChildren,
  type TCompoundComponent,
} from '@blog/ui/lib/react';
import { Fragment, type ElementType } from 'react';

import { PanelBody } from './components/body/panel-body';
import { PanelHeader } from './components/header/panel-header';
import { panelVariants } from './panel-variants';

const PanelSlotParts = {
  Header: PanelHeader,
  Body: PanelBody,
} satisfies Record<string, ElementType>;

export type TPanelProps = IWithClassName &
  IWithDataTestId & {
    children?: TCompoundChildren<typeof PanelSlotParts>;
  };

/**
 * Panel — a bordered, rounded surface with a titled header bar above a
 * padded body, framing a self-contained feature (auth, account settings,
 * bookmarks, newsletter) as one distinct block on the page. Composes
 * `Panel.Header` and `Panel.Body`.
 */
const PanelRoot = ({ children, className, dataTestId }: TPanelProps) => {
  const { slots, unmatched } = mapCompoundSlots(children, PanelSlotParts);

  return (
    <div
      className={panelVariants({ class: className })}
      data-testid={dataTestId}
    >
      {slots.Header}
      {slots.Body}
      {unmatched.map((node, i) => (
        <Fragment key={i}>{node}</Fragment>
      ))}
    </div>
  );
};

export const Panel: TCompoundComponent<
  typeof PanelRoot,
  typeof PanelSlotParts
> = Object.assign(PanelRoot, PanelSlotParts);
