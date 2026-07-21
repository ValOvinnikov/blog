import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GenericPage } from './generic-page';

const { getPageMock } = vi.hoisted(() => ({
  getPageMock: vi.fn(),
}));

const { notFoundMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      generic: { v1: { getPage: getPageMock } },
    },
  },
}));

vi.mock('next/navigation', () => ({
  notFound: notFoundMock,
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: ({ modules }: { modules: { id: string }[] }) => (
    <div data-testid="module-renderer">{modules.length} modules</div>
  ),
}));

describe(`<${GenericPage.name}/>`, () => {
  beforeEach(() => {
    getPageMock.mockReset();
    notFoundMock.mockClear();
  });

  it('calls notFound() when the page does not exist', async () => {
    getPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(
      GenericPage({ slug: 'missing', locale: 'EN' }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

  it('renders the ModuleRenderer with the fetched modules', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [{ id: 'module-1', type: 'module_content' }],
        seo: {
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
          ogImageUrl: undefined,
        },
      },
    });

    const ui = await GenericPage({ slug: 'about-us', locale: 'EN' });
    render(<>{ui}</>);

    expect(screen.getByTestId('module-renderer')).toHaveTextContent(
      '1 modules',
    );
  });
});
