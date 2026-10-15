import { BRAND_VARIANT, type TBrandVariant } from '@blog/config';
import type { ReactNode } from 'react';

const BAND_CLASS: Record<TBrandVariant, string> = {
  [BRAND_VARIANT.PRIMARY]: 'bg-primary',
  [BRAND_VARIANT.SECONDARY]: 'bg-secondary surface-secondary',
  [BRAND_VARIANT.BRAND_PRIMARY]: 'bg-brand-primary-muted surface-brand-primary',
};

export const SurfaceBands = ({ children }: { children: ReactNode }) => (
  <div className="flex w-80 flex-col">
    {Object.values(BRAND_VARIANT).map((variant) => (
      <div
        key={variant}
        className={`${BAND_CLASS[variant]} flex flex-col gap-3 p-6`}
      >
        <span className="font-mono text-meta text-text-muted">{variant}</span>
        {children}
      </div>
    ))}
  </div>
);
