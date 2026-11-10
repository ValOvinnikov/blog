import {
  CARD_STYLE_DECLARATIONS,
  type IWithClassName,
  type TCardStyle,
} from '@blog/config';
import type { ReactNode } from 'react';

import { StyleVariants } from './style-variants';

// theme.css derives --radius-item in @theme, i.e. on :root, so an inline --item-radius alone does not reach it.
const DERIVED_ITEM_RADIUS = { '--radius-item': 'var(--item-radius)' } as const;

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
