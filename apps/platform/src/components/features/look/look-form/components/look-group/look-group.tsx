import type { TLookRowsGroup } from '@platform/components/features/look/look-form/use-look-open-rows';
import { Accordion } from '@platform/components/shared/accordion';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import type { TLookRowKey } from '@platform/utils/look-open-rows/look-open-rows';
import { useId, type ReactNode } from 'react';

import { lookGroupVariants } from './look-group-variants';

export type TLookGroupProps = {
  title: string;
  group: TLookRowsGroup;
  children: ReactNode;
};

export const LookGroup = ({ title, group, children }: TLookGroupProps) => {
  const labelId = useId();
  const { label, list } = lookGroupVariants();

  return (
    <section aria-labelledby={labelId}>
      <p id={labelId} className={label()}>
        {title}
      </p>
      <Accordion<TLookRowKey>
        multiple={true}
        variant={ACCORDION_VARIANT.ROW}
        openValues={group.openValues}
        onOpenValuesChange={group.onOpenValuesChange}
        className={list()}
      >
        {children}
      </Accordion>
    </section>
  );
};
