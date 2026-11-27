import { CTA_VARIANT } from '@shinefold/config';
import {
  MOCK_HIGHLIGHTED_PHRASE,
  MOCK_ONE_HIGHLIGHT_PIECES,
  toHeadingWords,
} from '@shinefold/ui/testing/heading-pieces';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_CONTENT,
  MOCK_CTA_MODULE_ID,
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_SECONDARY_ACTION,
  mockCtaModuleData,
} from '@web/testing/modules/cta/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { CtaModuleView } from './cta-module-view';

const MOCK_CTA_MODULE = mockCtaModuleData();
const MOCK_CTA_HEADING = MOCK_CTA_MODULE.headingBlock.heading;
const INSTANCE_COUNT = 2;

const setup = customRender(CtaModuleView, {
  id: MOCK_CTA_MODULE_ID,
  module: MOCK_CTA_MODULE,
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

  describe('with two instances of the same module', () => {
    beforeEach(() => {
      Array.from({ length: INSTANCE_COUNT }).forEach(() => setup());
    });

    it('gives each instance a distinct heading id', () => {
      const headings = screen.getAllByRole('heading', {
        level: 2,
        name: MOCK_CTA_HEADING,
      });
      const headingIds = headings.map(({ id }) => id);

      expect(new Set(headingIds).size).toBe(INSTANCE_COUNT);
    });

    it('labels each instance by its own heading', () => {
      const regions = screen.getAllByRole('region', {
        name: MOCK_CTA_HEADING,
      });

      expect(regions).toHaveLength(INSTANCE_COUNT);
    });
  });

  it('renders the authored actions as links, in order', () => {
    setup({ module: mockCtaModuleData({ ctaButtons: MOCK_CTA_ACTIONS }) });

    const [primaryLink, secondaryLink, ...otherLinks] =
      screen.getAllByRole('link');

    expect(primaryLink).toHaveTextContent(MOCK_CTA_PRIMARY_ACTION.link.label);
    expect(secondaryLink).toHaveTextContent(
      MOCK_CTA_SECONDARY_ACTION.link.label,
    );
    expect(otherLinks).toHaveLength(0);
  });

  it('renders the optional rich-text content', () => {
    setup({ module: mockCtaModuleData({ content: MOCK_CTA_CONTENT }) });

    const trialText = screen.getByText('14-day trial');
    const listItems = screen.getAllByRole('listitem');

    expect(trialText).toBeVisible();
    expect(listItems).toHaveLength(2);
  });

  it.each(Object.values(CTA_VARIANT))(
    'renders the %s layout under its heading',
    (variant) => {
      setup({ module: mockCtaModuleData({ variant }) });

      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_CTA_HEADING,
      });

      expect(heading).toBeVisible();
    },
  );

  it('draws the highlighted phrase inside a heading named by its plain words', () => {
    const highlightedHeading = toHeadingWords(MOCK_ONE_HIGHLIGHT_PIECES);
    setup({
      module: mockCtaModuleData({
        headingBlock: mockHeadingBlock({
          heading: highlightedHeading,
          headingPieces: MOCK_ONE_HIGHLIGHT_PIECES,
        }),
      }),
    });

    const region = screen.getByRole('region', { name: highlightedHeading });
    const heading = screen.getByRole('heading', { level: 2 });

    expect(region).toBeVisible();
    expect(heading).toContainElement(screen.getByText(MOCK_HIGHLIGHTED_PHRASE));
  });
});
