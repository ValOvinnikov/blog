import {
  SITE_THEME_FRAME_ATTRIBUTE,
  SKIN_ATTRIBUTE,
} from '@platform/constants/site-theme-frame';
import { toScopedDeclarationsCss } from '@platform/utils/scoped-declarations-css/scoped-declarations-css';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import type { IWithChildren } from '@shinefold/config/react';
import type { IWithClassName } from '@shinefold/config/types';
import { useId, type CSSProperties } from 'react';

import { siteThemeFrameVariants } from './site-theme-frame-variants';

export type TSiteThemeFrameProps = IWithClassName &
  IWithChildren & {
    theme: TSitePreviewTheme;
    testId: string;
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
      {skinScopeTokens && (
        <style>
          {toScopedDeclarationsCss(
            `[${SITE_THEME_FRAME_ATTRIBUTE}="${frameId}"] [${SKIN_ATTRIBUTE}]`,
            skinScopeTokens,
          )}
        </style>
      )}
      {children}
    </div>
  );
};
