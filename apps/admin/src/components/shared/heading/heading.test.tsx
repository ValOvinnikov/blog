import { render, screen } from '@admin/testing/custom-render';

import { Heading } from './heading';

describe(Heading, () => {
  it.each([1, 2, 3, 4] as const)(
    'renders a semantic h%i for level %i',
    (level) => {
      render(
        <Heading level={level} size="cardTitle">
          Tenant details
        </Heading>,
      );
      expect(screen.getByRole('heading', { level })).toHaveTextContent(
        'Tenant details',
      );
    },
  );

  it('renders its children as text content', () => {
    render(
      <Heading level={1} size="pageTitle">
        Add tenant
      </Heading>,
    );
    expect(screen.getByText('Add tenant')).toBeVisible();
  });

  it('keeps size independent of level — every level/size combination renders without throwing', () => {
    const levels = [1, 2, 3, 4] as const;
    const sizes = ['pageTitle', 'cardTitle', 'fieldLabel'] as const;

    for (const level of levels) {
      for (const size of sizes) {
        expect(() =>
          render(
            <Heading level={level} size={size}>
              Heading
            </Heading>,
          ),
        ).not.toThrow();
      }
    }
  });
});
