import { ICONS, FORM_STATUS } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_NEWSLETTER_EMAIL_LABEL,
  mockNewsletterSignupArgs,
} from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';

import { NewsletterSignupFull } from './newsletter-signup-full';

faker.seed(123);

const PROMPT_TEST_ID = 'newsletter-signup-input-prompt';
const MOCK_HEADING = faker.lorem.sentence(3);
const MOCK_HEADING_ID = faker.string.uuid();
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence(8);
const MOCK_SUCCESS_MESSAGE = faker.lorem.sentence();
const MOCK_FIRST_CUE = faker.lorem.words(2);
const MOCK_SECOND_CUE = faker.lorem.words(3);

const baseArgs = {
  ...mockNewsletterSignupArgs(),
  heading: MOCK_HEADING,
};

const setup = customRender(NewsletterSignupFull, baseArgs);

describe(`<${NewsletterSignupFull.name}/>`, () => {
  it('renders the heading as an h2 with the supporting text', () => {
    setup({ supportingText: MOCK_SUPPORTING_TEXT });

    const heading = screen.getByRole('heading', {
      name: MOCK_HEADING,
      level: 2,
    });
    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

    expect(heading).toBeVisible();
    expect(supportingText).toBeVisible();
  });

  it.each([1, 3, 4] as const)(
    'renders the heading at level %i when headingLevel names it',
    (headingLevel) => {
      setup({ headingLevel });

      const heading = screen.getByRole('heading', {
        name: MOCK_HEADING,
        level: headingLevel,
      });

      expect(heading).toBeVisible();
    },
  );

  it('assigns headingId to the heading element when provided', () => {
    setup({ headingId: MOCK_HEADING_ID });

    const heading = screen.getByRole('heading', { name: MOCK_HEADING });

    expect(heading).toHaveAttribute('id', MOCK_HEADING_ID);
  });

  it('renders no heading when heading is omitted', () => {
    setup({ heading: undefined });

    const heading = screen.queryByRole('heading', { name: MOCK_HEADING });
    const emailField = screen.getByRole('textbox', {
      name: MOCK_NEWSLETTER_EMAIL_LABEL,
    });

    expect(heading).not.toBeInTheDocument();
    expect(emailField).toBeVisible();
  });

  it('renders the trust cues without a heading when heading is omitted', () => {
    setup({
      heading: undefined,
      trustCues: [
        { icon: <Icon name={ICONS.SHIELD_CHECK} />, label: MOCK_FIRST_CUE },
      ],
    });

    const heading = screen.queryByRole('heading', { name: MOCK_HEADING });
    const cue = screen.getByText(MOCK_FIRST_CUE);

    expect(heading).not.toBeInTheDocument();
    expect(cue).toBeVisible();
  });

  it('renders the chevron icon as the email field prompt', () => {
    setup();

    const prompt = screen.getByTestId(PROMPT_TEST_ID);

    expect(prompt).toBeVisible();
  });

  it('renders no trust-cue list when trustCues is omitted', () => {
    setup();

    const cueList = screen.queryByRole('list');

    expect(cueList).not.toBeInTheDocument();
  });

  it('renders every trust cue provided', () => {
    setup({
      trustCues: [
        { icon: <Icon name={ICONS.SHIELD_CHECK} />, label: MOCK_FIRST_CUE },
        { icon: <Icon name={ICONS.X} />, label: MOCK_SECOND_CUE },
      ],
    });

    const firstCue = screen.getByText(MOCK_FIRST_CUE);
    const secondCue = screen.getByText(MOCK_SECOND_CUE);

    expect(firstCue).toBeVisible();
    expect(secondCue).toBeVisible();
  });

  it('shows the success message and hides the field on success', () => {
    setup({
      status: FORM_STATUS.SUCCESS,
      successMessage: MOCK_SUCCESS_MESSAGE,
    });

    const message = screen.getByText(MOCK_SUCCESS_MESSAGE);
    const emailField = screen.queryByRole('textbox', {
      name: MOCK_NEWSLETTER_EMAIL_LABEL,
    });

    expect(message).toBeVisible();
    expect(emailField).not.toBeInTheDocument();
  });
});
