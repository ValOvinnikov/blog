import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  makeHeroBlogData,
  makeStaleUnresolvedHeroBlogData,
  makeUnresolvedHeroBlogData,
} from '@web/testing/modules/hero-blog/fixtures';
import { DEFAULT_REQUEST_CONTEXT } from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { HeroBlogModule } from './hero-blog-module';

const { getHeroBlogMock } = vi.hoisted(() => ({
  getHeroBlogMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      heroBlog: { v1: { getHeroBlog: getHeroBlogMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/utils/logger/logger');

const getRequestContextMock = vi.mocked(getRequestContext);
const loggerErrorMock = vi.mocked(logger.error);

const setup = customRenderAsync(HeroBlogModule, {
  id: 'hero-blog-1',
});

describe(`<${HeroBlogModule.name}/>`, () => {
  beforeEach(() => {
    getHeroBlogMock.mockReset();
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
  });

  it('forwards the resolved tenant Sanity context to getHeroBlog', async () => {
    const tenant = {
      projectId: 'tenant-project',
      dataset: 'production',
      token: 'tenant-token',
    };
    getRequestContextMock.mockResolvedValue({
      ...DEFAULT_REQUEST_CONTEXT,
      sanityContext: tenant,
    });
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData(),
    });

    await setup();

    expect(getHeroBlogMock).toHaveBeenCalledWith('hero-blog-1', tenant);
  });

  it('renders nothing when the fetch fails', async () => {
    getHeroBlogMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the resolved heading', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData({ heading: 'Hello World' }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('logs and renders nothing when no post resolves', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeUnresolvedHeroBlogData(),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'hero_blog_module.post_unresolved',
      { id: 'hero-blog-1' },
    );
  });

  it('renders nothing without an error log when the post has no version in the request language', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeUnresolvedHeroBlogData({ isPostUntranslated: true }),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('logs and renders nothing for a stale hasPost: false result carrying a heading', async () => {
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeStaleUnresolvedHeroBlogData(
        'Stale hero title left over from an unpublished post',
      ),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'hero_blog_module.post_unresolved',
      { id: 'hero-blog-1' },
    );
  });

  it('renders the hero image resolving through the Sanity CDN', async () => {
    const sanityImage = makeSanityImage();
    getHeroBlogMock.mockResolvedValue({
      ok: true,
      data: makeHeroBlogData({ sanityImage }),
    });

    await setup();

    const img = screen.getByRole('img', { name: sanityImage.alt });
    expect(img.getAttribute('src')).toContain('cdn.sanity.io');
  });
});
