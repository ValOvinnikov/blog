import type { TPagePostType } from '@blog/config';
import type { TModule } from '@blog/service';
import { customRender, screen } from '@web/testing/custom-render';

import { BlogPostModuleRenderer } from './blog-post-module-renderer';

const {
  ctaModuleMock,
  newsletterModuleMock,
  postRelatedModuleMock,
  loggerWarnMock,
} = vi.hoisted(() => ({
  ctaModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-cta">{id}</div>
  )),
  newsletterModuleMock: vi.fn(({ id }: { id: string }) => (
    <div data-testid="stub-newsletter">{id}</div>
  )),
  postRelatedModuleMock: vi.fn(
    ({ id, context }: { id: string; context?: { post?: { id: string } } }) => (
      <div data-testid="stub-post-related">
        {id}:{context?.post?.id}
      </div>
    ),
  ),
  loggerWarnMock: vi.fn(),
}));

vi.mock('@web/modules/cta/cta-module', () => ({ CtaModule: ctaModuleMock }));
vi.mock('@web/modules/newsletter/newsletter-module', () => ({
  NewsletterModule: newsletterModuleMock,
}));
vi.mock('@web/modules/post-related/post-related-module', () => ({
  PostRelatedModule: postRelatedModuleMock,
}));

vi.mock('@web/utils/logger/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: loggerWarnMock,
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const setup = customRender(BlogPostModuleRenderer, {
  modules: [] as TModule<TPagePostType>[],
  locale: 'en',
  tenant: 'tenant-1',
});

describe(`<${BlogPostModuleRenderer.name}/>`, () => {
  beforeEach(() => {
    ctaModuleMock.mockClear();
    newsletterModuleMock.mockClear();
    postRelatedModuleMock.mockClear();
    loggerWarnMock.mockClear();
  });

  it('renders every allowed module keyed by its id, in the given order', () => {
    setup({
      modules: [
        { id: 'related-1', type: 'module_postRelated' },
        { id: 'newsletter-1', type: 'module_newsletter' },
        { id: 'cta-1', type: 'module_cta' },
      ],
    });

    const stubs = screen.getAllByTestId(/^stub-/);
    expect(stubs.map((node) => node.getAttribute('data-testid'))).toEqual([
      'stub-post-related',
      'stub-newsletter',
      'stub-cta',
    ]);
  });

  it('renders nothing and warns once for a module absent from the post page allow-list', () => {
    setup({
      modules: [
        { id: 'hero-1', type: 'module_hero' },
      ] as unknown as TModule<TPagePostType>[],
    });

    expect(screen.queryByText('hero-1')).not.toBeInTheDocument();
    expect(loggerWarnMock).toHaveBeenCalledTimes(1);
    expect(loggerWarnMock).toHaveBeenCalledWith(
      'module_renderer.unknown_module_type',
      { moduleType: 'module_hero' },
    );
  });

  it('forwards the post context to a module that reads it', () => {
    setup({
      modules: [{ id: 'related-1', type: 'module_postRelated' }],
      context: { post: { id: 'post-1' } },
    });

    expect(screen.getByTestId('stub-post-related')).toHaveTextContent(
      'related-1:post-1',
    );
  });
});
