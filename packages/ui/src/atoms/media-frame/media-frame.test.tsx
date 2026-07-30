import {
  customRender,
  renderElement,
  screen,
} from '@blog/ui/testing/custom-render';

import { MediaFrame } from './media-frame';

const setup = customRender(MediaFrame, {});

describe(`<${MediaFrame.name}/>`, () => {
  it('renders as a <div> element', () => {
    const { container } = setup();
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('forwards HTML attributes', () => {
    const { container } = renderElement(<MediaFrame data-testid="frame" />);
    expect(container.firstChild).toHaveAttribute('data-testid', 'frame');
  });

  it('renders children', () => {
    setup({ children: <span>child content</span> });
    expect(screen.getByText('child content')).toBeVisible();
  });
});
