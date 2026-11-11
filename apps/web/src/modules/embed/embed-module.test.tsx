import { errorResult, okResult } from '@blog/utils';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import {
  MOCK_EMBED_MODULE_ID,
  mockEmbedModule,
} from '@web/testing/modules/embed/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import { MOCK_TENANT_SANITY_CONTEXT } from '@web/testing/shared/tenant/fixtures';

import { EmbedModule } from './embed-module';

const { getEmbedModuleMock } = vi.hoisted(() => ({
  getEmbedModuleMock: vi.fn(),
}));

vi.mock('@web/i18n/navigation');

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      embed: { v1: { getEmbedModule: getEmbedModuleMock } },
    },
  },
}));

vi.mock('@web/server/request-context/request-context');

const MOCK_EMBED_MODULE = mockEmbedModule();

const setup = customRenderAsync(EmbedModule, { id: MOCK_EMBED_MODULE_ID });

describe(`<${EmbedModule.name}/>`, () => {
  beforeEach(() => {
    getEmbedModuleMock.mockReset();
    getEmbedModuleMock.mockResolvedValue(okResult(MOCK_EMBED_MODULE));
  });

  describe('once fetched', () => {
    beforeEach(async () => {
      await setup();
    });

    it('fetches the module with the tenant Sanity context', () => {
      expect(getEmbedModuleMock).toHaveBeenCalledWith(
        MOCK_EMBED_MODULE_ID,
        MOCK_TENANT_SANITY_CONTEXT,
      );
    });

    it('renders the resolved module', () => {
      const region = screen.getByRole('region', {
        name: MOCK_EMBED_MODULE.headingBlock.heading,
      });

      expect(region).toBeVisible();
    });
  });

  it('renders nothing when the fetch fails', async () => {
    getEmbedModuleMock.mockResolvedValue(errorResult(MOCK_ERROR));

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
