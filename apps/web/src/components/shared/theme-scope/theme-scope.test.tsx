import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { customRender, screen, within } from '@web/testing/custom-render';

import { ThemeScope } from './theme-scope';

const THEME_TOKENS = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

const setup = customRender(ThemeScope, {
  themeTokens: THEME_TOKENS,
  children: <div>content</div>,
});

describe(`<${ThemeScope.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders children', () => {
    expect(screen.getByText('content')).toBeVisible();
  });

  it('injects the resolved theme tokens as a <style> block', () => {
    const style = within(document.head).getByText(
      '--brand-primary: oklch(0.45 0.17 250);',
      { exact: false, ignore: false },
    );
    expect(style).toBeInstanceOf(HTMLStyleElement);
  });
});
