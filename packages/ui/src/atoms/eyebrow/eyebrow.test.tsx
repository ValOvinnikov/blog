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
});
