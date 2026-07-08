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

  it('accepts className override', () => {
    const { container } = render(<MediaFrame className="aspect-video" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      'aspect-video',
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
