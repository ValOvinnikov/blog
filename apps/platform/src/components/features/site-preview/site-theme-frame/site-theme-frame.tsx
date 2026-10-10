import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { CSSProperties, ReactNode } from 'react';

import { siteThemeFrameVariants } from './site-theme-frame-variants';

export type TSiteThemeFrameProps = {
  theme: TSitePreviewTheme;
  className?: string;
  testId: string;
  children: ReactNode;
};

export const SiteThemeFrame = ({
  theme,
  className,
  testId,
  children,
}: TSiteThemeFrameProps) => {
  const { tokenStyle, isDark, headingFontFamily, bodyFontFamily } = theme;

  return (
    <div
      inert={true}
      className={siteThemeFrameVariants({ isDark, className })}
      style={
        {
          ...tokenStyle,
          '--font-display-family': headingFontFamily,
          '--font-body-family': bodyFontFamily,
        } as CSSProperties
      }
      data-testid={testId}
    >
      {children}
    </div>
  );
};
