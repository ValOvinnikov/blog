import type { ReactNode } from 'react';

export type TTokenSectionProps = {
  title: string;
  children: ReactNode;
};

/** Section shell for a group of tokens in the design-token gallery. */
export const TokenSection = ({ title, children }: TTokenSectionProps) => (
  <section className="mb-12">
    <h2 className="mb-4 border-b border-border pb-3 font-mono text-lg text-text-subtle uppercase">
      {title}
    </h2>
    <div className="space-y-8">{children}</div>
  </section>
);
