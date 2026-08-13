import { customRender, screen } from '@blog/ui/testing/custom-render';
import { createRef } from 'react';

import { SliderRange } from './slider-range';

const setup = customRender(SliderRange, { dataTestId: 'range' });

describe(`<${SliderRange.name}/>`, () => {
  it('renders', () => {
    setup();
    expect(screen.getByTestId('range')).toBeVisible();
  });

  it('applies a consumer/behavior-library-supplied width via style', () => {
    setup({ style: { width: '40%' } });
    expect(screen.getByTestId('range')).toHaveStyle({ width: '40%' });
  });

  it('forwards a ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref });
    expect(ref.current).toBe(screen.getByTestId('range'));
  });
});
