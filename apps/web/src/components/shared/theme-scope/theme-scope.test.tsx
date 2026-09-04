import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { customRender } from '@web/testing/custom-render';

import { ThemeScope } from './theme-scope';

const THEME_TOKENS = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;

const setup = customRender(ThemeScope, {
  themeTokens: THEME_TOKENS,
  children: <div>content</div>,
});

describe(`<${ThemeScope.name}/>`, () => {
  it('renders children', () => {
    const { getByText } = setup();

    expect(getByText('content')).toBeVisible();
  });

  it('injects the resolved theme tokens as a <style> block', () => {
    setup();

    const style = document.head.querySelector(
      'style[data-href="tenant-theme"]',
    );
    expect(style?.innerHTML).toContain(
      '--brand-primary: oklch(0.53 0.17 250);',
    );
  });

  it('applies the font-variable class to the wrapper', () => {
    const { container } = setup();

    expect(container.firstChild).toHaveClass('--font-display-family');
  });
});
