import { BRAND_VARIANT, type TBrandVariant } from '@blog/config';
import type { ReactNode } from 'react';
import { within } from 'storybook/test';

const BRAND_BAND_CLASSES = {
  [BRAND_VARIANT.PRIMARY]: 'bg-primary',
  [BRAND_VARIANT.SECONDARY]: 'bg-secondary surface-secondary',
  [BRAND_VARIANT.BRAND_PRIMARY]: 'bg-brand-primary-muted surface-brand-primary',
} as const satisfies Record<TBrandVariant, string>;

export const BRAND_BAND_LABELS = {
  [BRAND_VARIANT.PRIMARY]: 'Primary',
  [BRAND_VARIANT.SECONDARY]: 'Secondary',
  [BRAND_VARIANT.BRAND_PRIMARY]: 'Brand primary',
} as const satisfies Record<TBrandVariant, string>;

export const BrandBand = ({
  tone,
  children,
}: {
  tone: TBrandVariant;
  children: ReactNode;
}) => (
  <div
    className={BRAND_BAND_CLASSES[tone]}
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1.5rem',
      padding: '1.5rem',
    }}
  >
    {children}
  </div>
);

export const focusLastLink = ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  within(canvasElement).getAllByRole('link').at(-1)?.focus();
};
