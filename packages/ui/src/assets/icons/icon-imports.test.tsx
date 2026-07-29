import { render, screen } from '@testing-library/react';

import SunIcon from './sun.svg';
import sunIconUrl from './sun.svg?url';

// Smoke test for the build-tooling contract #878's icon registry depends on:
// a bare `.svg` import resolves to an SVGR React component, and the `?url`
// suffix resolves to the emitted asset URL — see packages/ui/vitest.config.ts,
// packages/ui/.storybook/main.ts, and apps/web/next.config.ts for the
// per-bundler config this proves.
describe('svg import tooling', () => {
  it('resolves a bare .svg import to a renderable React component (SVGR)', () => {
    render(<SunIcon data-testid="sun-icon" />);

    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
  });

  it('keeps the source viewBox on the compiled SVG so CSS-driven resizing (Icon.tsx) rescales correctly', () => {
    render(<SunIcon data-testid="sun-icon" />);

    expect(screen.getByTestId('sun-icon').getAttribute('viewBox')).toBe(
      '0 0 24 24',
    );
  });

  it('resolves a `.svg?url` import to a non-empty asset URL string', () => {
    expect(typeof sunIconUrl).toBe('string');
    expect(sunIconUrl.length).toBeGreaterThan(0);
  });
});
