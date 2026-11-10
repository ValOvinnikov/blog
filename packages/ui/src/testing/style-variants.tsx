import type { IWithClassName, TThemeDeclarations } from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { CSSProperties, ReactNode } from 'react';

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
    {objectKeys(declarations).map((style) => (
      <div
        key={style}
        className={variantClassName}
        style={
          { ...declarations[style], ...sharedDeclarations } as CSSProperties
        }
      >
        <p>{style}</p>
        {children(style)}
      </div>
    ))}
  </div>
);
