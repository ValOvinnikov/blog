import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen, within } from '@web/testing/custom-render';
import { buildThemeStyleBlock } from '@web/utils/build-theme-style-block';

import { ThemeScope } from './theme-scope';

faker.seed(6007);

const THEME_TOKENS = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
const MOCK_CONTENT = faker.lorem.sentence();

const setup = customRender(ThemeScope, {
  themeTokens: THEME_TOKENS,
  children: <div>{MOCK_CONTENT}</div>,
});

describe(`<${ThemeScope.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders children', () => {
    const content = screen.getByText(MOCK_CONTENT);

    expect(content).toBeVisible();
  });

  it('injects the resolved theme tokens into the document head', () => {
    const style = within(document.head).getByText(
      buildThemeStyleBlock(THEME_TOKENS),
      { ignore: false, normalizer: (text) => text },
    );

    expect(style).toBeInstanceOf(HTMLStyleElement);
  });
});
