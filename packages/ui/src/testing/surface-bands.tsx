import { BRAND_VARIANT } from '@shinefold/config';
import type { ReactNode } from 'react';

export const SurfaceBands = ({ children }: { children: ReactNode }) => (
  <div className="flex w-80 flex-col">
    {Object.values(BRAND_VARIANT).map((variant) => (
      <div
        key={variant}
        className="flex flex-col gap-3 bg-ambient p-6"
        data-skin={variant}
      >
        <span className="font-mono text-meta text-text-muted">{variant}</span>
        {children}
      </div>
    ))}
  </div>
);
