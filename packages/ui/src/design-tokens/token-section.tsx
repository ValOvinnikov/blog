import type { ReactNode } from 'react';

export type TTokenSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/**
 * Groups a set of token samples under a titled section, matching the
 * category headings used throughout the Design Tokens gallery.
 */
export const TokenSection = ({
  title,
  description,
  children,
}: TTokenSectionProps) => (
  <section className="flex flex-col gap-4 border-b border-border pb-10 last:border-b-0 last:pb-0">
    <div className="flex flex-col gap-1">
      <h2 className="font-display text-title-xl font-medium text-text">
        {title}
      </h2>
      {description ? (
        <p className="text-copy text-muted">{description}</p>
      ) : null}
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </section>
);
