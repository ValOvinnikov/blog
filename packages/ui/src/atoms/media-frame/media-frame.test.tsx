import { render, screen } from '@testing-library/react';

import { MediaFrame } from './media-frame';

describe(`<${MediaFrame.name}/>`, () => {
  it('renders as a <div> element', () => {
    const { container } = render(<MediaFrame />);
    expect(container.firstChild?.nodeName).toBe('DIV');
  });

  it('has relative class', () => {
    const { container } = render(<MediaFrame />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'relative',
    );
  });

  it('ratio="video" applies aspect-video', () => {
    const { container } = render(<MediaFrame ratio="video" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-video',
    );
  });

  it('ratio="square" applies aspect-square', () => {
    const { container } = render(<MediaFrame ratio="square" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-square',
    );
  });

  it('ratio="portrait" applies aspect-[3/4]', () => {
    const { container } = render(<MediaFrame ratio="portrait" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-[3/4]',
    );
  });

  it('accepts arbitrary aspect-ratio via className', () => {
    const { container } = render(<MediaFrame className="aspect-[16/9]" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-[16/9]',
    );
  });

  it('forwards HTML attributes', () => {
    const { container } = render(<MediaFrame data-testid="frame" />);
    expect(container.firstChild).toHaveAttribute('data-testid', 'frame');
  });

  it('renders children', () => {
    render(
      <MediaFrame>
        <span>child content</span>
      </MediaFrame>,
    );
    expect(screen.getByText('child content')).toBeVisible();
  });
});
