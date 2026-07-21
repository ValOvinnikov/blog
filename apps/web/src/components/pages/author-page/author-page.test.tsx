import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthorPage } from './author-page';

const { getAuthorMock } = vi.hoisted(() => ({
  getAuthorMock: vi.fn(),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      author: { v1: { getAuthor: getAuthorMock } },
    },
  },
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

const author = {
  id: 'author-1',
  name: 'Jane Doe',
  slug: 'jane-doe',
  role: 'Senior Engineer',
  imageUrl: 'https://cdn.example.com/jane.jpg',
  bio: [
    {
      _type: 'block' as const,
      _key: 'b1',
      children: [
        { _type: 'span' as const, _key: 's1', text: 'Builds things.' },
      ],
    },
  ],
  socialLinks: [
    { platform: 'X', url: 'https://x.com/janedoe' },
    { platform: 'GitHub', url: 'https://github.com/janedoe' },
  ],
};

describe('AuthorPage', () => {
  beforeEach(() => {
    getAuthorMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the author does not exist', async () => {
    getAuthorMock.mockResolvedValue(null);

    await expect(AuthorPage({ slug: 'missing' })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders the author role, name, bio, and social links', async () => {
    getAuthorMock.mockResolvedValue(author);

    const ui = await AuthorPage({ slug: 'jane-doe' });
    render(<>{ui}</>);

    expect(screen.getByText('Senior Engineer')).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Jane Doe' }),
    ).toBeVisible();
    expect(screen.getByText('Builds things.')).toBeVisible();

    const xLink = screen.getByRole('link', { name: 'X' });
    expect(xLink).toHaveAttribute('href', 'https://x.com/janedoe');
    const githubLink = screen.getByRole('link', { name: 'GitHub' });
    expect(githubLink).toHaveAttribute('href', 'https://github.com/janedoe');
    expect(notFoundMock).not.toHaveBeenCalled();
  });

  it('renders without a role and without social links when none are authored', async () => {
    getAuthorMock.mockResolvedValue({
      ...author,
      role: undefined,
      socialLinks: [],
    });

    const ui = await AuthorPage({ slug: 'jane-doe' });
    render(<>{ui}</>);

    expect(screen.queryByText('Senior Engineer')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
