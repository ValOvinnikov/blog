import { render, screen } from '@testing-library/react';

import { Eyebrow } from './eyebrow';

describe(`<${Eyebrow.name}/>`, () => {
  it('renders children', () => {
    render(<Eyebrow>Featured Post</Eyebrow>);
    expect(screen.getByText('Featured Post')).toBeVisible();
  });

  it('renders as a <p> element', () => {
    const { container } = render(<Eyebrow>Label</Eyebrow>);
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('has text-accent class', () => {
    const { container } = render(<Eyebrow>Label</Eyebrow>);
    expect((container.firstChild as HTMLElement).className).toContain(
      'text-accent',
    );
  });

  it('accepts className override', () => {
    render(<Eyebrow className="mt-2">Label</Eyebrow>);
    expect(screen.getByText('Label').className).toContain('mt-2');
  });
});
