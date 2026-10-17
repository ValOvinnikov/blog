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

    expect(screen.getByRole('heading', { name: heading })).toBeVisible();
    expect(screen.getByText(supportingText)).toBeVisible();
  });

  it('renders the heading as an h2 when headingLevel is omitted', () => {
    setup({ heading });

    expect(
      screen.getByRole('heading', { name: heading, level: 2 }),
    ).toBeVisible();
  });

  it.each([1, 3, 4] as const)(
    'renders the heading at level %i when headingLevel names it',
    (headingLevel) => {
      setup({ heading, headingLevel });

      expect(
        screen.getByRole('heading', { name: heading, level: headingLevel }),
      ).toBeVisible();
    },
  );

  it('assigns headingId to the heading element when provided', () => {
    setup({ heading, headingId: 'newsletter-full-heading' });

    expect(screen.getByRole('heading', { name: heading })).toHaveAttribute(
      'id',
      'newsletter-full-heading',
    );
  });

  it('renders the heading with no id when headingId is omitted', () => {
    setup({ heading });

    expect(screen.getByRole('heading', { name: heading })).not.toHaveAttribute(
      'id',
    );
  });

  it('renders no heading when heading is omitted', () => {
    setup({ heading: undefined });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: EMAIL_LABEL })).toBeVisible();
  });

  it('renders the trust cues without a heading when heading is omitted', () => {
    setup({
      heading: undefined,
      trustCues: [
        { icon: <Icon name={ICONS.SHIELD_CHECK} />, label: FIRST_CUE },
      ],
    });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText(FIRST_CUE)).toBeVisible();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the chevron icon as the email field prompt', () => {
      expect(
        screen.getByTestId('newsletter-signup-input-prompt'),
      ).toBeVisible();
    });

    it('renders no trust-cue row when trustCues is omitted', () => {
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
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

    expect(screen.getByText(FIRST_CUE)).toBeVisible();
    expect(screen.getByText(SECOND_CUE)).toBeVisible();
  });

  it('shows the success message and hides the field on success', () => {
    const successMessage = faker.lorem.sentence();
    setup({ status: FORM_STATUS.SUCCESS, successMessage });

    expect(screen.getByRole('status')).toHaveTextContent(successMessage);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    setup({ dataTestId: 'newsletter-signup-full' });
    expect(screen.getByTestId('newsletter-signup-full')).toBeVisible();
  });
});
