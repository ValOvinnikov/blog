import { NEWSLETTER_VARIANT, SITE_MESSAGES } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_NEWSLETTER_MODULE_ID,
  mockNewsletterModule,
} from '@web/testing/modules/newsletter/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { NEWSLETTER_SUBSCRIBED_COOKIE_NAME } from '@web/utils/newsletter-subscribed-cookie-name/newsletter-subscribed-cookie-name';

import { NewsletterModuleView } from './newsletter-module-view';

faker.seed(6011);

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const { emailAriaLabel } = SITE_MESSAGES.newsletterForm;

const BAND_TEST_ID = `newsletter-module-${MOCK_NEWSLETTER_MODULE_ID}`;
const COOKIE_EXPIRED = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';

const MOCK_HEADING = faker.company.catchPhrase();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_FIRST_CUE = faker.lorem.words(2);
const MOCK_SECOND_CUE = faker.lorem.words(3);
const MOCK_CONTENT = faker.lorem.sentences(2);

const setup = customRender(NewsletterModuleView, {
  id: MOCK_NEWSLETTER_MODULE_ID,
  ...mockNewsletterModule({
    headingBlock: mockHeadingBlock({
      heading: MOCK_HEADING,
      supportingText: MOCK_SUPPORTING_TEXT,
    }),
    trustCues: [MOCK_FIRST_CUE, MOCK_SECOND_CUE],
  }),
});

describe(`<${NewsletterModuleView.name}/>`, () => {
  afterEach(() => {
    document.cookie = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=; ${COOKIE_EXPIRED}`;
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the authored supporting text', () => {
      const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

      expect(supportingText).toBeVisible();
    });

    it('renders the authored heading exactly once, as an h2', () => {
      const headings = screen.getAllByRole('heading');
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_HEADING,
      });

      expect(headings).toHaveLength(1);
      expect(heading).toBeVisible();
    });

    it('labels the section landmark by the rendered heading', () => {
      const region = screen.getByRole('region', { name: MOCK_HEADING });

      expect(region).toBeVisible();
    });

    it('renders the authored trust cues for a FULL module', () => {
      const firstCue = screen.getByText(MOCK_FIRST_CUE);
      const secondCue = screen.getByText(MOCK_SECOND_CUE);

      expect(firstCue).toBeVisible();
      expect(secondCue).toBeVisible();
    });

    it('renders the band and the form on first render without the cookie', () => {
      const band = screen.getByTestId(BAND_TEST_ID);
      const emailInput = screen.getByRole('textbox', { name: emailAriaLabel });

      expect(band).toBeVisible();
      expect(emailInput).toBeVisible();
    });
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headings = screen.getAllByRole('heading', {
      level: 2,
      name: MOCK_HEADING,
    });
    const regions = screen.getAllByRole('region', { name: MOCK_HEADING });
    const headingIds = headings.map(({ id }) => id);

    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
  });

  it("renders a FULL module's content text in the panel", () => {
    setup({ content: MOCK_CONTENT });

    const contentText = screen.getByText(MOCK_CONTENT);

    expect(contentText).toBeVisible();
  });

  it('renders a COMPACT module with only its heading and the form', () => {
    setup({ variant: NEWSLETTER_VARIANT.COMPACT, content: MOCK_CONTENT });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: MOCK_HEADING,
    });
    const emailInput = screen.getByRole('textbox', { name: emailAriaLabel });
    const supportingText = screen.queryByText(MOCK_SUPPORTING_TEXT);
    const firstCue = screen.queryByText(MOCK_FIRST_CUE);
    const contentText = screen.queryByText(MOCK_CONTENT);

    expect(heading).toBeVisible();
    expect(emailInput).toBeVisible();
    expect(supportingText).not.toBeInTheDocument();
    expect(firstCue).not.toBeInTheDocument();
    expect(contentText).not.toBeInTheDocument();
  });

  it('renders no trust cues when the tenant never authored any', () => {
    setup({ trustCues: undefined });

    const firstCue = screen.queryByText(MOCK_FIRST_CUE);

    expect(firstCue).not.toBeInTheDocument();
  });

  it('renders neither band nor form for an already-subscribed reader', () => {
    document.cookie = `${NEWSLETTER_SUBSCRIBED_COOKIE_NAME}=1`;

    setup();

    const band = screen.queryByTestId(BAND_TEST_ID);
    const emailInput = screen.queryByRole('textbox', { name: emailAriaLabel });

    expect(band).not.toBeInTheDocument();
    expect(emailInput).not.toBeInTheDocument();
  });
});
