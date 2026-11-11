import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_PRIMARY_ACTION,
} from '@web/testing/modules/cta/fixtures';
import {
  MOCK_EMBED_MODULE_ID,
  mockEmbed,
  mockEmbedModule,
} from '@web/testing/modules/embed/fixtures';

import { EmbedModuleView } from './embed-module-view';

vi.mock('@web/i18n/navigation');

const MOCK_EMBED = mockEmbed();
const MOCK_EMBED_MODULE = mockEmbedModule({ embed: MOCK_EMBED });

const setup = customRender(EmbedModuleView, {
  module: MOCK_EMBED_MODULE,
  titleId: MOCK_EMBED_MODULE_ID,
});

describe(`<${EmbedModuleView.name}/>`, () => {
  describe('with an embed', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section by its heading', () => {
      const region = screen.getByRole('region', {
        name: MOCK_EMBED_MODULE.headingBlock.heading,
      });

      expect(region).toBeVisible();
    });

    it('renders the embed behind its placeholder', () => {
      const title = screen.getByText(MOCK_EMBED.title);

      expect(title).toBeVisible();
    });
  });

  it('renders nothing when the module has no embed', () => {
    const { container } = setup({
      module: mockEmbedModule({ embed: undefined }),
    });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the authored actions', () => {
    setup({ module: mockEmbedModule({ ctaButtons: MOCK_CTA_ACTIONS }) });

    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });

    expect(action).toHaveAttribute('href', MOCK_CTA_PRIMARY_ACTION.link.href);
  });
});
