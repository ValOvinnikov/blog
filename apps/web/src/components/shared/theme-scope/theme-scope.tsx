import type { TThemeTokens } from '@blog/config';
import { resolveFontVariableClassName } from '@web/config/fonts';
import { buildThemeStyleBlock } from '@web/utils/build-theme-style-block';
import type { ReactNode } from 'react';

type TThemeScopeProps = {
  themeTokens: TThemeTokens;
  children: ReactNode;
};

/**
 * ThemeScope — establishes the given theme tokens for `children`: a
 * `next/font` variable class on a wrapper element, plus the resolved theme
 * `<style>` block. The `<style>` carries `precedence`/`href` so React
 * hoists it into `<head>` itself — this component can mount anywhere in
 * the tree with no ordering constraint on its siblings.
 */
export const ThemeScope = ({ themeTokens, children }: TThemeScopeProps) => {
  const fontVariableClassName = resolveFontVariableClassName(
    themeTokens.headingFont,
    themeTokens.bodyFont,
  );

  return (
    <div className={fontVariableClassName}>
      <style
        precedence="theme"
        href="tenant-theme"
        dangerouslySetInnerHTML={{
          __html: buildThemeStyleBlock(themeTokens),
        }}
      />
      {children}
    </div>
  );
};
