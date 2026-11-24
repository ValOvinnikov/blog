import { SITE_THEME_FRAME_ATTRIBUTE } from '@platform/constants/site-theme-frame';
import { toScopedDeclarationsCss } from '@platform/utils/scoped-declarations-css/scoped-declarations-css';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import { useId, type CSSProperties, type ReactNode } from 'react';

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
  const {
    tokenStyle,
    skinScopeTokens,
    isDark,
    headingFontFamily,
    bodyFontFamily,
  } = theme;
  const frameId = useId();

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
      {...{ [SITE_THEME_FRAME_ATTRIBUTE]: frameId }}
    >
      <style>
        {toScopedDeclarationsCss(
          `[${SITE_THEME_FRAME_ATTRIBUTE}="${frameId}"] [data-skin]`,
          skinScopeTokens,
        )}
      </style>
      {children}
    </div>
  );
};
