import { resolveFontVariableClassName } from '@web/config/fonts';
import { buildThemeStyleBlock } from '@web/utils/build-theme-style-block';
import type { TSiteThemeTokens } from '@web/utils/to-theme-tokens';
import type { ReactNode } from 'react';

type TThemeScopeProps = {
  themeTokens: TSiteThemeTokens;
  children: ReactNode;
};

/**
 * The `<style>` carries `precedence`/`href` so React hoists it into
 * `<head>` itself — this component can mount anywhere in the tree with no
 * ordering constraint on its siblings.
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
