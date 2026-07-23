import { customRenderAsync, screen } from '@web/testing/custom-render';

import { ContentModule } from './content-module';

const { getContentMock } = vi.hoisted(() => ({
  getContentMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      content: { v1: { getContent: getContentMock } },
    },
  },
}));

const setup = customRenderAsync(ContentModule, {
  id: 'content-1',
  locale: 'en',
});

describe(ContentModule, () => {
  beforeEach(() => {
    getContentMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getContentMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the title as an h2 labelling the section via a unique id derived from the module id', async () => {
    getContentMock.mockResolvedValue({
      ok: true,
      data: { title: 'About us', body: [] },
    });

    await setup();

    const heading = screen.getByRole('heading', { level: 2, name: 'About us' });
    expect(heading).toHaveAttribute('id', 'content-content-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'content-content-1');
  });

  it('derives a different heading id for a different module id, avoiding duplicate DOM ids', async () => {
    getContentMock.mockResolvedValue({
      ok: true,
      data: { title: 'Another section', body: [] },
    });

    await setup({ id: 'content-2' });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Another section',
    });
    expect(heading).toHaveAttribute('id', 'content-content-2');
  });
});
