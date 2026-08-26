import { Icon } from '@admin/components/shared/icon';
import { ICONS } from '@blog/config';
import type { ReactNode } from 'react';

import { disclosureVariants } from './disclosure-variants';

export type TDisclosureProps = {
  /** Content of the collapsed row's label, rendered before the chevron. */
  summary: ReactNode;
  children: ReactNode;
  isDefaultOpen?: boolean;
  className?: string;
};

export const Disclosure = ({
  summary,
  children,
  isDefaultOpen = false,
  className,
}: TDisclosureProps) => {
  const { root, summary: summarySlot, chevron, inner } = disclosureVariants();

  return (
    <details className={root({ class: className })} open={isDefaultOpen}>
      <summary className={summarySlot()}>
        {summary}
        <Icon name={ICONS.CHEVRON_RIGHT} className={chevron()} />
      </summary>
      <div className={inner()}>{children}</div>
    </details>
  );
};
