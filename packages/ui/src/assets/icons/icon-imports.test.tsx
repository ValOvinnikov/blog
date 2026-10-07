import { render, screen } from '@testing-library/react';

import SunIcon from './sun.svg';
import sunIconUrl from './sun.svg?url';

describe('svg import tooling', () => {
  describe('a bare .svg import', () => {
    beforeEach(() => {
      render(<SunIcon data-testid="sun-icon" />);
    });

    it('resolves to a renderable React component (SVGR)', () => {
      expect(screen.getByTestId('sun-icon')).toBeVisible();
    });

    it('keeps the source viewBox on the compiled SVG so CSS-driven resizing (Icon.tsx) rescales correctly', () => {
      expect(screen.getByTestId('sun-icon').getAttribute('viewBox')).toBe(
        '0 0 24 24',
      );
    });
  });

  it('resolves a `.svg?url` import to a non-empty asset URL string', () => {
    expect(typeof sunIconUrl).toBe('string');
    expect(sunIconUrl.length).toBeGreaterThan(0);
  });
});
