import { render, screen } from '@platform/testing/custom-render';

import { StudioShell } from './studio-shell';

describe(StudioShell, () => {
  it('renders its children', () => {
    render(
      <StudioShell>
        <div>studio content</div>
      </StudioShell>,
    );

    expect(screen.getByText('studio content')).toBeVisible();
  });

  it('renders without throwing', () => {
    expect(() =>
      render(
        <StudioShell>
          <span>content</span>
        </StudioShell>,
      ),
    ).not.toThrow();
  });
});
