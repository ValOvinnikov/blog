import { ICONS, FORM_STATUS } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { NewsletterSignupFull } from './newsletter-signup-full';

faker.seed(123);

const SUBMIT_LABEL = faker.lorem.word();
const EMAIL_LABEL = faker.lorem.words(2);
const FIRST_CUE = faker.lorem.words(2);
const SECOND_CUE = faker.lorem.words(3);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: FORM_STATUS.IDLE,
  heading: faker.lorem.sentence(3),
  submitLabel: SUBMIT_LABEL,
  emailAriaLabel: EMAIL_LABEL,
};

const setup = customRender(NewsletterSignupFull, baseArgs);

describe(`<${NewsletterSignupFull.name}/>`, () => {
  let heading: string;

  beforeEach(() => {
    heading = faker.lorem.sentence(3);
  });

  it('renders the heading and supportingText by default', () => {
    const supportingText = faker.lorem.sentence(8);
    setup({ heading, supportingText });

    const headingElement = screen.getByRole('heading', { name: heading });
    const supportingTextElement = screen.getByText(supportingText);

    expect(headingElement).toBeVisible();
    expect(supportingTextElement).toBeVisible();
  });

  it('renders the heading as an h2 when headingLevel is omitted', () => {
    setup({ heading });

    const headingElement = screen.getByRole('heading', {
      name: heading,
      level: 2,
    });

    expect(headingElement).toBeVisible();
  });

  it.each([1, 3, 4] as const)(
    'renders the heading at level %i when headingLevel names it',
    (headingLevel) => {
      setup({ heading, headingLevel });

      const headingElement = screen.getByRole('heading', {
        name: heading,
        level: headingLevel,
      });

      expect(headingElement).toBeVisible();
    },
  );

  it('assigns headingId to the heading element when provided', () => {
    setup({ heading, headingId: 'newsletter-full-heading' });

    const headingElement = screen.getByRole('heading', { name: heading });

    expect(headingElement).toHaveAttribute('id', 'newsletter-full-heading');
  });

  it('renders the heading with no id when headingId is omitted', () => {
    setup({ heading });

    const headingElement = screen.getByRole('heading', { name: heading });

    expect(headingElement).not.toHaveAttribute('id');
  });

  it('renders no heading when heading is omitted', () => {
    setup({ heading: undefined });

    const headingElement = screen.queryByRole('heading');
    const emailField = screen.getByRole('textbox', { name: EMAIL_LABEL });

    expect(headingElement).not.toBeInTheDocument();
    expect(emailField).toBeVisible();
  });

  it('renders the trust cues without a heading when heading is omitted', () => {
    setup({
      heading: undefined,
      trustCues: [
        { icon: <Icon name={ICONS.SHIELD_CHECK} />, label: FIRST_CUE },
      ],
    });

    const headingElement = screen.queryByRole('heading');
    const cue = screen.getByText(FIRST_CUE);

    expect(headingElement).not.toBeInTheDocument();
    expect(cue).toBeVisible();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the chevron icon as the email field prompt', () => {
      const prompt = screen.getByTestId('newsletter-signup-input-prompt');

      expect(prompt).toBeVisible();
    });

    it('renders no trust-cue row when trustCues is omitted', () => {
      const cueList = screen.queryByRole('list');

      expect(cueList).not.toBeInTheDocument();
    });
  });

  it('renders trust cues when provided', () => {
    const trustCues = [
      {
        icon: <Icon name={ICONS.SHIELD_CHECK} />,
        label: FIRST_CUE,
      },
      {
        icon: <Icon name={ICONS.X} />,
        label: SECOND_CUE,
      },
    ];
    setup({ trustCues });

    const firstCue = screen.getByText(FIRST_CUE);
    const secondCue = screen.getByText(SECOND_CUE);

    expect(firstCue).toBeVisible();
    expect(secondCue).toBeVisible();
  });

  it('shows the success message and hides the field on success', () => {
    const successMessage = faker.lorem.sentence();
    setup({ status: FORM_STATUS.SUCCESS, successMessage });

    const status = screen.getByRole('status');
    const emailField = screen.queryByRole('textbox');

    expect(status).toHaveTextContent(successMessage);
    expect(emailField).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup-full' });

    const root = screen.getByTestId('newsletter-signup-full');

    expect(root).toBeVisible();
  });
});
