import { render, screen } from '@testing-library/react';

import { Tag } from './tag';

describe(`<${Tag.name}/>`, () => {
  it('renders a span element', () => {
    render(<Tag>Label</Tag>);
    expect(screen.getByText('Label').tagName).toBe('SPAN');
  });

  it('merges extra className', () => {
    render(<Tag className="mt-4">Label</Tag>);
    expect(screen.getByText('Label').className).toContain('mt-4');
  });

  it('accent variant applies accent background class', () => {
    render(<Tag variant="accent">Label</Tag>);
    expect(screen.getByText('Label').className).toContain('bg-accent');
  });

  it('sm size applies text-xs class', () => {
    render(<Tag size="sm">Label</Tag>);
    expect(screen.getByText('Label').className).toContain('text-xs');
  });
});
