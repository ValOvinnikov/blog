import { customRender, screen } from '@platform/testing/custom-render';

import { Skeleton } from './skeleton';

const setup = customRender(Skeleton, {});

describe(`<${Skeleton.name}/>`, () => {
  it('is hidden from assistive technology', () => {
    setup();

    const skeleton = screen.getByTestId('skeleton');

    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });
});
