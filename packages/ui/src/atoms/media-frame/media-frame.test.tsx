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

  it('ratio="video" applies aspect-video', () => {
    const { container } = setup({ ratio: 'video' });
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-video',
    );
  });

  it('ratio="square" applies aspect-square', () => {
    const { container } = setup({ ratio: 'square' });
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-square',
    );
  });

  it('ratio="portrait" applies aspect-[3/4]', () => {
    const { container } = setup({ ratio: 'portrait' });
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-[3/4]',
    );
  });

  it('ratio="classic" applies aspect-[4/3]', () => {
    const { container } = setup({ ratio: 'classic' });
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-[4/3]',
    );
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
