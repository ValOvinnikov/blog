import { render, screen } from '@testing-library/react';

import { Tag } from './tag';

describe(`<${Tag.name}/>`, () => {
  it('renders a span element', () => {
    render(<Tag>Label</Tag>);
    expect(screen.getByText('Label').tagName).toBe('SPAN');
  });

  it('default variant has a border', () => {
    render(<Tag>Label</Tag>);
    expect(screen.getByText('Label').className).toContain('border');
  });

  it('accent variant applies accent-muted background', () => {
    render(<Tag variant="accent">Label</Tag>);
    expect(screen.getByText('Label').className).toContain('bg-accent-muted');
  });
});
