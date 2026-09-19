import type { ReactNode } from 'react';

export type TTokenSectionProps = {
  title: string;
  children: ReactNode;
};

export const TokenSection = ({ title, children }: TTokenSectionProps) => (
  <section className="mb-12">
    <h2 className="border-b border-border pb-3 font-mono text-lg text-text-subtle uppercase">
      {title}
    </h2>
    <div className="space-y-8 pt-6">{children}</div>
  </section>
);
