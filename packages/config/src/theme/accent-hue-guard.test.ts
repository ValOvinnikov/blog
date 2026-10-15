import { renderedContrastRatio } from '@blog/utils/color';

import { isAccentHueAccessible } from './accent-hue-guard';

vi.mock('@blog/utils/color', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/utils/color')>()),
  renderedContrastRatio: vi.fn(),
}));

const mockedRenderedContrastRatio = vi.mocked(renderedContrastRatio);

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import('@blog/utils/color')>(
      '@blog/utils/color',
    );
  mockedRenderedContrastRatio.mockImplementation(actual.renderedContrastRatio);
});

describe(isAccentHueAccessible, () => {
  it('accepts the Console preset accent hue', () => {
    expect(isAccentHueAccessible(250)).toBe(true);
  });

  it('accepts the Editorial preset accent hue', () => {
    expect(isAccentHueAccessible(28)).toBe(true);
  });

  it('rejects a hue when the rendered contrast ratio falls below the AA floor', () => {
    mockedRenderedContrastRatio.mockReturnValue(1);

    expect(isAccentHueAccessible(310)).toBe(false);
  });
});
