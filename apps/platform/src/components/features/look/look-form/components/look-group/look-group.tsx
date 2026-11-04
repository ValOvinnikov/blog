import type { IWithChildren } from '@blog/config/react';
import type { TLookRowsGroup } from '@platform/components/features/look/look-form/use-look-open-rows';
import { Accordion } from '@platform/components/shared/accordion';
import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import type { TLookGroup } from '@platform/constants/look-group';
import type { TLookRow } from '@platform/constants/look-row';
import {
  LOOK_ANCHOR_CLASSES,
  toLookAnchorId,
} from '@platform/utils/look-anchor/look-anchor';
import { tv } from '@platform/utils/tv/tv';
import { useId } from 'react';

const lookGroupVariants = tv({
  slots: {
    root: [LOOK_ANCHOR_CLASSES],
    label: [
      'm-0 mb-2 ml-0.5 text-admin-11 leading-admin-14 font-semibold tracking-[0.06em] text-admin-muted uppercase',
    ],
    list: [
      'overflow-hidden rounded-admin border border-admin-line bg-admin-surface shadow-admin',
    ],
  },
});

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
