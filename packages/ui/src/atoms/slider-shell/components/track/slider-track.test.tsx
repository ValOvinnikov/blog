import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';
import { createRef } from 'react';

import { SliderTrack } from './slider-track';

const setup = customRender(SliderTrack, { dataTestId: 'track' });

describe(`<${SliderTrack.name}/>`, () => {
  it('renders', () => {
    setup();
    expect(screen.getByTestId('track')).toBeVisible();
  });

  it('applies a consumer-supplied background via style, unfought by any built-in class', () => {
    setup({ style: { background: 'red' } });
    expect(screen.getByTestId('track')).toHaveStyle({ background: 'red' });
  });

  it('applies a consumer-supplied background via className', () => {
    setup({ className: 'bg-[red]' });
    expect(screen.getByTestId('track')).toHaveClass('bg-[red]');
  });

  it('forwards data attributes a headless behavior library merges in (e.g. data-disabled)', () => {
    renderElement(<SliderTrack data-disabled="" dataTestId="track" />);
    expect(screen.getByTestId('track')).toHaveAttribute('data-disabled', '');
  });

  it('forwards a ref to the underlying element', () => {
    const ref = createRef<HTMLDivElement>();
    setup({ ref });
    expect(ref.current).toBe(screen.getByTestId('track'));
  });
});
