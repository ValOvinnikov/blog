import type { TLookRowsGroup } from '@platform/components/features/look/look-form/use-look-open-rows';
import { Accordion } from '@platform/components/shared/accordion';
import { SectionLabel } from '@platform/components/shared/section-label';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import type { TLookGroup } from '@platform/constants/look-group';
import type { TLookRow } from '@platform/constants/look-row';
import { toLookAnchorId } from '@platform/utils/look-anchor/look-anchor';
import type { IWithChildren } from '@shinefold/config/react';
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
  const { root, list } = lookGroupVariants();

  return (
    <section
      id={toLookAnchorId(anchor)}
      aria-labelledby={labelId}
      className={root()}
    >
      <SectionLabel id={labelId}>{title}</SectionLabel>
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
