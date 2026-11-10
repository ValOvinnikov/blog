import {
  CARD_STYLE,
  CARD_STYLE_DECLARATIONS,
  type IWithClassName,
  type TCardStyle,
} from '@blog/config';
import type { CSSProperties, ReactNode } from 'react';

// theme.css derives --radius-item in @theme, i.e. on :root, so an inline --item-radius alone does not reach it.
const DERIVED_ITEM_RADIUS = { '--radius-item': 'var(--item-radius)' };

type TCardStylesProps = IWithClassName & {
  children: (cardStyle: TCardStyle) => ReactNode;
};

export const CardStyles = ({ className, children }: TCardStylesProps) => (
  <div className="grid gap-6">
    {Object.values(CARD_STYLE).map((cardStyle) => (
      <div
        key={cardStyle}
        className={className}
        style={
          {
            ...CARD_STYLE_DECLARATIONS[cardStyle],
            ...DERIVED_ITEM_RADIUS,
          } as CSSProperties
        }
      >
        <p>{cardStyle}</p>
        {children(cardStyle)}
      </div>
    ))}
  </div>
);
