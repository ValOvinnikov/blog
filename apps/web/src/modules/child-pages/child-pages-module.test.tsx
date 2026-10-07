import { getRequestContext } from '@web/server/request-context/request-context';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { makeChildPagesModule } from '@web/testing/modules/child-pages/fixtures';
import {
  DEFAULT_REQUEST_CONTEXT,
  DEFAULT_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { ChildPagesModule } from './child-pages-module';

const { getChildPagesModuleMock } = vi.hoisted(() => ({
  getChildPagesModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      childPages: { v1: { getChildPagesModule: getChildPagesModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

vi.mock('@web/utils/logger/logger');

const getRequestContextMock = vi.mocked(getRequestContext);
const loggerWarnMock = vi.mocked(logger.warn);
const loggerErrorMock = vi.mocked(logger.error);

const setup = customRenderAsync(ChildPagesModule, {
  id: 'child-pages-1',
  context: { landingPage: { id: 'modules', path: 'modules' } },
});

describe(`<${ChildPagesModule.name}/>`, () => {
  beforeEach(() => {
    getChildPagesModuleMock.mockReset();
    getChildPagesModuleMock.mockResolvedValue({
      ok: true,
      data: makeChildPagesModule(),
    });
    getRequestContextMock.mockReset();
    getRequestContextMock.mockResolvedValue(DEFAULT_REQUEST_CONTEXT);
    loggerWarnMock.mockReset();
    loggerErrorMock.mockReset();
  });

  describe('with the landing page context', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module for the landing page it sits on', async () => {
      expect(getChildPagesModuleMock).toHaveBeenCalledWith(
        'child-pages-1',
        'modules',
        'modules',
        DEFAULT_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders a card per child page linking to its full path', async () => {
      expect(screen.getByRole('link', { name: 'FAQ' })).toHaveAttribute(
        'href',
        '/modules/faq',
      );
    });
  });

  it('renders nothing when the page has no children', async () => {
    getChildPagesModuleMock.mockResolvedValue({
      ok: true,
      data: makeChildPagesModule({ pages: [] }),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing and logs an error when the fetch fails', async () => {
    getChildPagesModuleMock.mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
    expect(loggerErrorMock).toHaveBeenCalledOnce();
  });

  it('renders nothing and warns, without fetching, outside a landing page', async () => {
    const { container } = await setup({ context: undefined });

    expect(container).toBeEmptyDOMElement();
    expect(getChildPagesModuleMock).not.toHaveBeenCalled();
    expect(loggerWarnMock).toHaveBeenCalledOnce();
  });
});
