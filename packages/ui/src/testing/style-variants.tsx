import type { IWithClassName, TThemeDeclarations } from '@shinefold/config';
import type { CSSProperties, ReactNode } from 'react';
import { entries } from 'remeda';

type TStyleVariantsProps<TStyle extends string> = IWithClassName & {
  declarations: Record<TStyle, TThemeDeclarations>;
  sharedDeclarations?: TThemeDeclarations;
  variantClassName?: string;
  children: (style: TStyle) => ReactNode;
};

export const StyleVariants = <TStyle extends string>({
  declarations,
  sharedDeclarations,
  className,
  variantClassName,
  children,
}: TStyleVariantsProps<TStyle>) => (
  <div className={className}>
    {entries(declarations).map(([style, styleDeclarations]) => (
      <div
        key={style}
        className={variantClassName}
        style={{ ...styleDeclarations, ...sharedDeclarations } as CSSProperties}
      >
        <p>{style}</p>
        {children(style)}
      </div>
    ))}
  </div>
);
