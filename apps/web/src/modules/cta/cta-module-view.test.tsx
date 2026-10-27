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

const MOCK_CTA_MODULE = mockCtaModuleData();
const MOCK_CTA_HEADING = MOCK_CTA_MODULE.headingBlock.heading;
const INSTANCE_COUNT = 2;

const setup = customRender(CtaModuleView, {
  id: MOCK_CTA_MODULE_ID,
  ...MOCK_CTA_MODULE,
});

describe(`<${CtaModuleView.name}/>`, () => {
  describe('with the default module data', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section by its heading', () => {
      const region = screen.getByRole('region', { name: MOCK_CTA_HEADING });

      expect(region).toBeVisible();
    });

    it('renders no image when none is authored', () => {
      const image = screen.queryByRole('img');

      expect(image).not.toBeInTheDocument();
    });

    it('renders no actions when none are authored', () => {
      const links = screen.queryAllByRole('link');

      expect(links).toHaveLength(0);
    });
  });

  it('gives two instances of the same module distinct heading ids', () => {
    Array.from({ length: INSTANCE_COUNT }).forEach(() => setup());

    const headings = screen.getAllByRole('heading', {
      level: 2,
      name: MOCK_CTA_HEADING,
    });
    const headingIds = headings.map(({ id }) => id);

    expect(new Set(headingIds).size).toBe(INSTANCE_COUNT);
  });

  it('labels each of two instances by its own heading', () => {
    Array.from({ length: INSTANCE_COUNT }).forEach(() => setup());

    const regions = screen.getAllByRole('region', { name: MOCK_CTA_HEADING });

    expect(regions).toHaveLength(INSTANCE_COUNT);
  });

  it('renders the authored actions as links, in order', () => {
    setup({ ctaButtons: MOCK_CTA_ACTIONS });

    const [primaryLink, secondaryLink, ...otherLinks] =
      screen.getAllByRole('link');

    expect(primaryLink).toHaveTextContent(MOCK_CTA_PRIMARY_ACTION.link.label);
    expect(secondaryLink).toHaveTextContent(
      MOCK_CTA_SECONDARY_ACTION.link.label,
    );
    expect(otherLinks).toHaveLength(0);
  });

  it('renders the optional rich-text content', () => {
    setup({ content: MOCK_CTA_CONTENT });

    const trialText = screen.getByText('14-day trial');
    const listItems = screen.getAllByRole('listitem');

    expect(trialText).toBeVisible();
    expect(listItems).toHaveLength(2);
  });
});
