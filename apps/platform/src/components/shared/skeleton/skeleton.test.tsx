import { render, screen } from '@platform/testing/custom-render';

import { Skeleton } from './skeleton';

describe(Skeleton, () => {
  it('is hidden from assistive technology', () => {
    render(<Skeleton />);

    expect(screen.getByTestId('skeleton')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });
});
