import { NEWSLETTER_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_NEWSLETTER_MODULE_ID,
  mockNewsletterModule,
} from '@web/testing/modules/newsletter/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { NewsletterModuleView } from './newsletter-module-view';

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const EMAIL_INPUT_NAME = 'Email address';
const BAND_TEST_ID = `newsletter-module-${MOCK_NEWSLETTER_MODULE_ID}`;

const heading = faker.company.catchPhrase();
const supportingText = faker.lorem.sentence();
const firstCue = faker.lorem.words(2);
const secondCue = faker.lorem.words(3);
const content = faker.lorem.sentences(2);

const setup = customRender(NewsletterModuleView, {
  id: MOCK_NEWSLETTER_MODULE_ID,
  ...mockNewsletterModule({
    headingBlock: makeHeadingBlock({ heading, supportingText }),
    trustCues: [firstCue, secondCue],
  }),
});

describe(`<${NewsletterModuleView.name}/>`, () => {
  afterEach(() => {
    document.cookie =
      'newsletter_subscribed=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  });
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the full signup with its heading and supporting text', () => {
      const headingElement = screen.getByRole('heading', { name: heading });
      const supportingTextElement = screen.getByText(supportingText);
      const emailInput = screen.getByRole('textbox', {
        name: EMAIL_INPUT_NAME,
      });
      expect(headingElement).toBeVisible();
      expect(supportingTextElement).toBeVisible();
      expect(emailInput).toBeVisible();
    });

    it('renders the authored heading exactly once, as an h2', () => {
      const headings = screen.getAllByRole('heading');
      const headingElement = screen.getByRole('heading', {
        level: 2,
        name: heading,
      });
      expect(headings).toHaveLength(1);
      expect(headingElement).toBeVisible();
    });

    it('labels the section landmark by the rendered heading', () => {
      const region = screen.getByRole('region', { name: heading });
      expect(region).toBeVisible();
    });

    it('renders the authored trust cues for a FULL module', () => {
      const firstCueElement = screen.getByText(firstCue);
      const secondCueElement = screen.getByText(secondCue);
      expect(firstCueElement).toBeVisible();
      expect(secondCueElement).toBeVisible();
    });

    it('renders the band and the form on first render without the cookie', () => {
      const band = screen.getByTestId(BAND_TEST_ID);
      const emailInput = screen.getByRole('textbox', {
        name: EMAIL_INPUT_NAME,
      });
      expect(band).toBeVisible();
      expect(emailInput).toBeVisible();
    });
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 2,
        name: heading,
      })
      .map(({ id }) => id);
    const regions = screen.getAllByRole('region', { name: heading });
    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
  });

  it("renders a FULL module's content text in the panel", () => {
    setup({ content });

    const contentText = screen.getByText(content);
    expect(contentText).toBeVisible();
  });

  it('renders a COMPACT module without content text', () => {
    setup({
      variant: NEWSLETTER_VARIANT.COMPACT,
      content,
    });

    const contentText = screen.queryByText(content);
    expect(contentText).not.toBeInTheDocument();
  });

  it('renders a COMPACT module without supporting text or trust cues', () => {
    setup({ variant: NEWSLETTER_VARIANT.COMPACT });

    const headingElement = screen.getByRole('heading', {
      level: 2,
      name: heading,
    });
    const supportingTextElement = screen.queryByText(supportingText);
    const firstCueElement = screen.queryByText(firstCue);
    expect(headingElement).toBeVisible();
    expect(supportingTextElement).not.toBeInTheDocument();
    expect(firstCueElement).not.toBeInTheDocument();
  });

  it('renders no trust cues when the tenant never authored any', () => {
    setup({ trustCues: undefined });

    const firstCueElement = screen.queryByText(firstCue);
    expect(firstCueElement).not.toBeInTheDocument();
  });

  it('renders neither band nor form for an already-subscribed reader', () => {
    document.cookie = 'newsletter_subscribed=1';

    setup();

    const band = screen.queryByTestId(BAND_TEST_ID);
    const emailInput = screen.queryByRole('textbox', {
      name: EMAIL_INPUT_NAME,
    });
    expect(band).not.toBeInTheDocument();
    expect(emailInput).not.toBeInTheDocument();
  });
});
