import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { useState, type ReactNode, type SyntheticEvent } from 'react';

import { disclosureVariants } from './disclosure-variants';

export type TDisclosureProps = {
  summary: ReactNode;
  children: ReactNode;
  isDefaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
};

export const Disclosure = ({
  summary,
  children,
  isDefaultOpen = false,
  isOpen,
  onOpenChange,
  className,
}: TDisclosureProps) => {
  const isControlled = isOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(isDefaultOpen);
  const open = isControlled ? isOpen : uncontrolledOpen;
  const { root, summary: summarySlot, chevron, inner } = disclosureVariants();

  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const nextOpen = event.currentTarget.open;
    if (isControlled) {
      onOpenChange?.(nextOpen);
    } else {
      setUncontrolledOpen(nextOpen);
    }
  };

  return (
    <details
      className={root({ class: className })}
      open={open}
      onToggle={handleToggle}
    >
      <summary className={summarySlot()}>
        {summary}
        <Icon name={ICONS.CHEVRON_RIGHT} className={chevron()} />
      </summary>
      <div className={inner()}>{children}</div>
    </details>
  );
};
