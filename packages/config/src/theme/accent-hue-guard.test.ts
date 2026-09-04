import { wcagContrastRatio } from '@blog/utils/color';

import { isAccentHueAccessible } from './accent-hue-guard';

vi.mock('@blog/utils/color', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/utils/color')>()),
  wcagContrastRatio: vi.fn(),
}));

const mockedWcagContrastRatio = vi.mocked(wcagContrastRatio);

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import('@blog/utils/color')>(
      '@blog/utils/color',
    );
  mockedWcagContrastRatio.mockImplementation(actual.wcagContrastRatio);
});

describe(isAccentHueAccessible, () => {
  it('accepts the Console preset accent hue', () => {
    expect(isAccentHueAccessible(250)).toBe(true);
  });

  it('accepts the Editorial preset accent hue', () => {
    expect(isAccentHueAccessible(28)).toBe(true);
  });

  it('rejects a hue when the WCAG contrast ratio falls below the AA floor', () => {
    mockedWcagContrastRatio.mockReturnValue(1);

    expect(isAccentHueAccessible(310)).toBe(false);
  });
});
