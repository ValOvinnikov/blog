import type { IWithChildren } from '@blog/config/react';
import type { TLookRowsGroup } from '@platform/components/features/look/look-form/use-look-open-rows';
import { Accordion } from '@platform/components/shared/accordion';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import type { TLookGroup } from '@platform/constants/look-group';
import type { TLookRow } from '@platform/constants/look-row';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';
import { useId } from 'react';

import { lookGroupVariants } from './look-group-variants';

export type TLookGroupProps = IWithChildren & {
  anchor: TLookGroup;
  title: string;
  group: TLookRowsGroup;
};

export const LookGroup = ({
  anchor,
  title,
  group,
  children,
}: TLookGroupProps) => {
  const labelId = useId();
  const { root, label, list } = lookGroupVariants();

  return (
    <section
      id={toLookAnchorId(anchor)}
      aria-labelledby={labelId}
      className={root()}
    >
      <p id={labelId} className={label()}>
        {title}
      </p>
      <Accordion<TLookRow>
        multiple={true}
        variant={ACCORDION_VARIANT.ROW}
        isList={true}
        openValues={group.openValues}
        onOpenValuesChange={group.onOpenValuesChange}
        actionsRef={group.actionsRef}
        className={list()}
      >
        {children}
      </Accordion>
    </section>
  );
};
