import { renderWithIntl, screen } from '@platform/testing/custom-render';

import { PageSkeleton } from './page-skeleton';

describe(PageSkeleton, () => {
  beforeEach(() => {
    renderWithIntl(<PageSkeleton />);
  });

  it('announces one loading status', () => {
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading page…');
  });

  it('hides every placeholder shape from assistive technology', () => {
    for (const shape of screen.getAllByTestId('skeleton')) {
      expect(shape).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
