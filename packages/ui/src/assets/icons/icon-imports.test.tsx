import { renderElement, screen } from '@blog/ui/testing/custom-render';

import SunIcon from './sun.svg';
import sunIconUrl from './sun.svg?url';

const SUN_ICON_TEST_ID = 'sun-icon';
const SUN_VIEW_BOX = '0 0 24 24';

describe('svg import tooling', () => {
  describe('a bare .svg import', () => {
    beforeEach(() => {
      renderElement(<SunIcon data-testid={SUN_ICON_TEST_ID} />);
    });

    it('resolves to a renderable React component', () => {
      const icon = screen.getByTestId(SUN_ICON_TEST_ID);

      expect(icon).toBeVisible();
    });

    it('keeps the source viewBox so CSS-driven resizing rescales', () => {
      const icon = screen.getByTestId(SUN_ICON_TEST_ID);

      expect(icon).toHaveAttribute('viewBox', SUN_VIEW_BOX);
    });
  });

  it('resolves a .svg?url import to a non-empty asset URL', () => {
    expect(typeof sunIconUrl).toBe('string');
    expect(sunIconUrl.length).toBeGreaterThan(0);
  });
});
