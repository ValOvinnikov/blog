import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { createRef } from 'react';

import { SliderThumb } from './slider-thumb';

const setup = customRender(SliderThumb, { dataTestId: 'thumb' });

describe(`<${SliderThumb.name}/>`, () => {
  it('renders', () => {
    setup();
    expect(screen.getByTestId('thumb')).toBeVisible();
  });

  it('applies a consumer/behavior-library-supplied position via style', () => {
    setup({ style: { left: '40%' } });
    expect(screen.getByTestId('thumb')).toHaveStyle({ left: '40%' });
  });

  it('forwards data attributes a headless behavior library merges in (e.g. data-dragging)', () => {
    renderElement(<SliderThumb data-dragging="" dataTestId="thumb" />);
    expect(screen.getByTestId('thumb')).toHaveAttribute('data-dragging', '');
  });

  it('forwards a ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref });
    expect(ref.current).toBe(screen.getByTestId('thumb'));
  });
});
