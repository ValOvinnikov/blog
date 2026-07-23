import { BRAND_VARIANTS } from '@blog/config';

import { buildBrandIconSvg } from './brand-icon-svg';

describe(buildBrandIconSvg, () => {
  it('keeps the same viewBox and polygon shapes regardless of variant', () => {
    const svg = buildBrandIconSvg(BRAND_VARIANTS.CONSOLE);

    expect(svg).toContain('viewBox="0 0 24 24"');
    expect(svg).toContain('points="12,3 22,7 12,11 2,7"');
    expect(svg).toContain('points="12,8 22,12 12,16 2,12"');
    expect(svg).toContain('points="12,13 22,17 12,21 2,17"');
    expect(svg).toContain('@media (prefers-color-scheme: dark)');
  });

  it('renders the Console light/dark fill colors', () => {
    const svg = buildBrandIconSvg(BRAND_VARIANTS.CONSOLE);

    expect(svg).toContain('.layer-1 { fill: #006ac5; }');
    expect(svg).toContain('.layer-2 { fill: #288de5; }');
    expect(svg).toContain('.layer-3 { fill: #63adf6; }');
    expect(svg).toContain('.layer-1 { fill: #007cd9; }');
    expect(svg).toContain('.layer-2 { fill: #3b9cf6; }');
    expect(svg).toContain('.layer-3 { fill: #73c3ff; }');
  });

  it('renders the Indigo light/dark fill colors', () => {
    const svg = buildBrandIconSvg(BRAND_VARIANTS.INDIGO);

    expect(svg).toContain('.layer-1 { fill: #3e36dd; }');
    expect(svg).toContain('.layer-2 { fill: #5966f3; }');
    expect(svg).toContain('.layer-3 { fill: #8a9cfc; }');
    expect(svg).toContain('.layer-1 { fill: #4849ef; }');
    expect(svg).toContain('.layer-2 { fill: #6a7bff; }');
    expect(svg).toContain('.layer-3 { fill: #9eb0ff; }');
  });

  it('falls back to the Console palette for an unrecognized variant', () => {
    const svg = buildBrandIconSvg(
      'NOT_A_REAL_VARIANT' as (typeof BRAND_VARIANTS)[keyof typeof BRAND_VARIANTS],
    );

    expect(svg).toContain('.layer-1 { fill: #006ac5; }');
    expect(svg).toContain('.layer-2 { fill: #288de5; }');
    expect(svg).toContain('.layer-3 { fill: #63adf6; }');
  });
});
