import type { ReactNode } from 'react';

export type TAccordionNoteProps = {
  id?: string;
  children: ReactNode;
  className?: string;
};

export const AccordionNote = ({
  id,
  children,
  className,
}: TAccordionNoteProps) => (
  <p id={id} className={className}>
    {children}
  </p>
);
