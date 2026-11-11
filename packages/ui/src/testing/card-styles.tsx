import {
  BRAND_VARIANT,
  CARD_STYLE_DECLARATIONS,
  type IWithClassName,
  type TCardStyle,
  type TThemeDeclarations,
} from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import type { ReactNode } from 'react';

import { BrandBand } from './brand-bands';
import { StyleVariants } from './style-variants';

// theme.css derives --radius-item in @theme, i.e. on :root, so an inline --item-radius alone does not reach it.
const DERIVED_ITEM_RADIUS = { '--radius-item': 'var(--item-radius)' } as const;

const NO_FRAME = {
  '--item-border-width': '0px',
  '--item-accent-width': '0px',
} as const satisfies TThemeDeclarations;

const FILL_AND_DIVIDER_DECLARATIONS = {
  FILLED: { ...NO_FRAME, '--item-fill-mix': '100%' },
  UNFRAMED: { ...NO_FRAME, '--item-divider-width': '1px' },
} as const satisfies Record<string, TThemeDeclarations>;

type TCardStylesProps = IWithClassName & {
  children: (cardStyle: TCardStyle) => ReactNode;
};

export const CardStyles = ({ className, children }: TCardStylesProps) => (
  <StyleVariants
    declarations={CARD_STYLE_DECLARATIONS}
    sharedDeclarations={DERIVED_ITEM_RADIUS}
    className="grid gap-6"
    variantClassName={className}
  >
    {children}
  </StyleVariants>
);

export const FilledAndUnframedOnEachBand = ({ children }: IWithChildren) => (
  <StyleVariants
    declarations={FILL_AND_DIVIDER_DECLARATIONS}
    className="grid gap-6"
  >
    {() =>
      Object.values(BRAND_VARIANT).map((tone) => (
        <BrandBand key={tone} tone={tone}>
          {children}
        </BrandBand>
      ))
    }
  </StyleVariants>
);
