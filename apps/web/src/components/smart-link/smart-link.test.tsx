import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SmartLink } from './smart-link';

describe('SmartLink', () => {
  it('renders the router Link for an internal href, without target or rel', () => {
    render(<SmartLink href="/blog/hello-world">Read post</SmartLink>);

    const link = screen.getByRole('link', { name: 'Read post' });
    expect(link).toHaveAttribute('href', '/blog/hello-world');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders a plain anchor with target and rel for an absolute href', () => {
    render(
      <SmartLink href="https://example.com" target="_blank">
        Visit site
      </SmartLink>,
    );

    const link = screen.getByRole('link', { name: 'Visit site' });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
