import type { IWithChildren } from '@blog/config/react';
import type { TLookRowsGroup } from '@platform/components/features/look/look-form/use-look-open-rows';
import { Accordion } from '@platform/components/shared/accordion';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import type { TLookRow } from '@platform/constants/look-row';
import { useId } from 'react';

import { lookGroupVariants } from './look-group-variants';

export type TLookGroupProps = IWithChildren & {
  title: string;
  group: TLookRowsGroup;
};

export const LookGroup = ({ title, group, children }: TLookGroupProps) => {
  const labelId = useId();
  const { label, list } = lookGroupVariants();

  return (
    <section aria-labelledby={labelId}>
      <p id={labelId} className={label()}>
        {title}
      </p>
      <Accordion<TLookRow>
        multiple={true}
        variant={ACCORDION_VARIANT.ROW}
        isList={true}
        openValues={group.openValues}
        onOpenValuesChange={group.onOpenValuesChange}
        className={list()}
      >
        {children}
      </Accordion>
    </section>
  );
};
