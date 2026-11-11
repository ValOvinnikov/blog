import {
  BRAND_VARIANT,
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  type IWithClassName,
  type TCardStyle,
} from '@blog/config';
import type { IWithChildren } from '@blog/config/react';
import type { ReactNode } from 'react';

import { BrandBand } from './brand-bands';
import { StyleVariants } from './style-variants';

// theme.css derives --radius-item in @theme, i.e. on :root, so an inline --item-radius alone does not reach it.
const DERIVED_ITEM_RADIUS = { '--radius-item': 'var(--item-radius)' } as const;

const FILLED_AND_PLAIN_DECLARATIONS = {
  [CARD_STYLE.FILLED]: CARD_STYLE_DECLARATIONS[CARD_STYLE.FILLED],
  [CARD_STYLE.PLAIN]: CARD_STYLE_DECLARATIONS[CARD_STYLE.PLAIN],
};

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

export const FilledAndPlainOnEachBand = ({ children }: IWithChildren) => (
  <StyleVariants
    declarations={FILLED_AND_PLAIN_DECLARATIONS}
    sharedDeclarations={DERIVED_ITEM_RADIUS}
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
