import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_CONTENT,
  MOCK_CTA_MODULE_ID,
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';

import { CtaModuleView } from './cta-module-view';

vi.mock('@web/i18n/navigation');

const {
  headingBlock: { heading: CTA_HEADING },
} = mockCtaModuleData();

const setup = customRender(CtaModuleView, {
  id: MOCK_CTA_MODULE_ID,
  ...mockCtaModuleData(),
});

describe(`<${CtaModuleView.name}/>`, () => {
  describe('with the default module data', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section by its heading', () => {
      const region = screen.getByRole('region', { name: CTA_HEADING });
      expect(region).toBeVisible();
    });

    it('renders no image when none is authored', () => {
      const image = screen.queryByRole('img');
      expect(image).not.toBeInTheDocument();
    });
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 2,
        name: CTA_HEADING,
      })
      .map(({ id }) => id);
    const regions = screen.getAllByRole('region', { name: CTA_HEADING });
    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
  });

  it('renders the authored actions as links, in order', () => {
    setup({ ctaButtons: MOCK_CTA_ACTIONS });

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveTextContent(MOCK_CTA_PRIMARY_ACTION.link.label);
    expect(links[1]).toHaveTextContent(MOCK_CTA_SECONDARY_ACTION.link.label);
  });

  it('renders no actions when none are authored', () => {
    setup({ ctaButtons: [] });

    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(0);
  });

  it('renders the optional rich-text content', () => {
    setup({ content: MOCK_CTA_CONTENT });

    const trialText = screen.getByText('14-day trial');
    const listItems = screen.getAllByRole('listitem');
    expect(trialText).toBeVisible();
    expect(listItems).toHaveLength(2);
  });
});
