import { BRAND_VARIANT, type TBrandVariant } from '@shinefold/config';
import { objectKeys } from '@shinefold/utils/primitives';
import type { ReactNode } from 'react';
import { within } from 'storybook/test';

export const BRAND_BAND_LABELS = {
  [BRAND_VARIANT.PRIMARY]: 'Primary',
  [BRAND_VARIANT.SECONDARY]: 'Secondary',
  [BRAND_VARIANT.BRAND_PRIMARY]: 'Brand primary',
  [BRAND_VARIANT.INK]: 'Ink',
} as const satisfies Record<TBrandVariant, string>;

export const BrandBand = ({
  tone,
  children,
}: {
  tone: TBrandVariant;
  children: ReactNode;
}) => (
  <div
    className="bg-ambient"
    data-skin={tone}
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

export const EveryBrandBand = ({
  children,
}: {
  children: (tone: TBrandVariant) => ReactNode;
}) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem' }}>
    {objectKeys(BRAND_BAND_LABELS).map((tone) => (
      <BrandBand key={tone} tone={tone}>
        {children(tone)}
      </BrandBand>
    ))}
  </div>
);

export const focusLastLink = ({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) => {
  within(canvasElement).getAllByRole('link').at(-1)?.focus();
};
