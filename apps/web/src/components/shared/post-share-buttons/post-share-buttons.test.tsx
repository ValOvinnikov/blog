import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { PostShareButtons } from './post-share-buttons';

const links = [
  {
    href: 'https://twitter.com/intent/tweet?text=Hi&url=https%3A%2F%2Fx.com',
    label: 'Share on X',
  },
  {
    href: 'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fx.com',
    label: 'Share on LinkedIn',
  },
];

describe(`<${PostShareButtons.name}/>`, () => {
  it('renders a link for each entry in links', () => {
    render(
      <PostShareButtons links={links} url="https://example.com/blog/hello" />,
    );

    links.forEach(({ href, label }) => {
      expect(screen.getByRole('link', { name: label })).toHaveAttribute(
        'href',
        href,
      );
    });
  });

  it('copies the given url to the clipboard when the copy button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <PostShareButtons links={links} url="https://example.com/blog/hello" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(writeText).toHaveBeenCalledWith('https://example.com/blog/hello');
  });
});
