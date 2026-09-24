import { customRender, screen } from '@blog/ui/testing/custom-render';

import { MediaFrame } from './media-frame';

const setup = customRender(MediaFrame, {});

describe(`<${MediaFrame.name}/>`, () => {
  it('renders as a <div> element', () => {
    const { container } = setup();
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('renders children', () => {
    setup({ children: <span>child content</span> });
    expect(screen.getByText('child content')).toBeVisible();
  });
});
