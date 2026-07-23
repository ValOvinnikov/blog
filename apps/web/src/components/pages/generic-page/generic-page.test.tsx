import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSeo } from '@web/testing/shared/seo/fixtures';
import { notFound } from 'next/navigation';

import { GenericPage } from './generic-page';

const { getPageMock } = vi.hoisted(() => ({
  getPageMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    pages: {
      generic: { v1: { getPage: getPageMock } },
    },
  },
}));

vi.mock('@web/modules/module-renderer', () => ({
  ModuleRenderer: ({ modules }: { modules: { id: string }[] }) => (
    <div data-testid="module-renderer">{modules.length} modules</div>
  ),
}));

const setup = customRenderAsync(GenericPage, {
  slug: 'about-us',
  locale: 'EN',
});

describe(`<${GenericPage.name}/>`, () => {
  beforeEach(() => {
    getPageMock.mockReset();
  });

  it('calls notFound() when the page does not exist', async () => {
    getPageMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    await expect(setup({ slug: 'missing' })).rejects.toThrow('NEXT_NOT_FOUND');

    expect(vi.mocked(notFound)).toHaveBeenCalledTimes(1);
  });

  it('renders the ModuleRenderer with the fetched modules', async () => {
    getPageMock.mockResolvedValue({
      ok: true,
      data: {
        title: 'About Us',
        slug: 'about-us',
        modules: [{ id: 'module-1', type: 'module_content' }],
        seo: makeSeo({
          title: 'About Us',
          description: 'Who we are.',
          ogTitle: 'About Us',
          ogDescription: 'Who we are.',
        }),
      },
    });

    await setup();

    expect(screen.getByTestId('module-renderer')).toHaveTextContent(
      '1 modules',
    );
  });
});
