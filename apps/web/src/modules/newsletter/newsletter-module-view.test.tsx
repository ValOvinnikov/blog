import { NEWSLETTER_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { makeNewsletterModule } from '@web/testing/modules/newsletter/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { NewsletterModuleView } from './newsletter-module-view';

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: vi.fn(),
}));

const heading = faker.company.catchPhrase();
const supportingText = faker.lorem.sentence();
const firstCue = faker.lorem.words(2);
const secondCue = faker.lorem.words(3);
const content = faker.lorem.sentences(2);

const setup = customRender(NewsletterModuleView, {
  id: 'newsletter-1',
  ...makeNewsletterModule({
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

    it('renders the full signup with the authored heading and supporting text', () => {
      expect(screen.getByRole('heading', { name: heading })).toBeVisible();
      expect(screen.getByText(supportingText)).toBeVisible();
      expect(
        screen.getByRole('textbox', { name: 'Email address' }),
      ).toBeVisible();
    });

    it('renders the authored heading exactly once, as an h2', () => {
      expect(screen.getAllByRole('heading')).toHaveLength(1);
      expect(
        screen.getByRole('heading', { level: 2, name: heading }),
      ).toBeVisible();
    });

    it('labels the section landmark by the rendered heading', () => {
      expect(screen.getByRole('region', { name: heading })).toBeVisible();
    });

    it('renders the authored trust cues for a FULL module', () => {
      expect(screen.getByText(firstCue)).toBeVisible();
      expect(screen.getByText(secondCue)).toBeVisible();
    });

    it('renders the band and the form together on first render without the cookie', () => {
      expect(
        screen.getByTestId('newsletter-module-newsletter-1'),
      ).toBeVisible();
      expect(
        screen.getByRole('textbox', { name: 'Email address' }),
      ).toBeVisible();
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
    expect(new Set(headingIds).size).toBe(2);
    expect(screen.getAllByRole('region', { name: heading })).toHaveLength(2);
  });

  it("renders a FULL module's content text in the panel", () => {
    setup({ content });

    expect(screen.getByText(content)).toBeVisible();
  });

  it('renders a COMPACT module without content text', () => {
    setup({
      variant: NEWSLETTER_VARIANT.COMPACT,
      content,
    });

    expect(screen.queryByText(content)).not.toBeInTheDocument();
  });

  it('renders a COMPACT module without supporting text or trust cues', () => {
    setup({ variant: NEWSLETTER_VARIANT.COMPACT });

    expect(
      screen.getByRole('heading', { level: 2, name: heading }),
    ).toBeVisible();
    expect(screen.queryByText(supportingText)).not.toBeInTheDocument();
    expect(screen.queryByText(firstCue)).not.toBeInTheDocument();
  });

  it('renders no trust cues when the tenant never authored any', () => {
    setup({ trustCues: undefined });

    expect(screen.queryByText(firstCue)).not.toBeInTheDocument();
  });

  it('renders neither the band nor the form for a reader with the subscribed cookie', () => {
    document.cookie = 'newsletter_subscribed=1';

    setup();

    expect(
      screen.queryByTestId('newsletter-module-newsletter-1'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Email address' }),
    ).not.toBeInTheDocument();
  });
});
