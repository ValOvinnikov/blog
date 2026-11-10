import { ICONS } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_NEWSLETTER_EMAIL_LABEL,
  makeNewsletterSignupForm,
} from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';

import { NewsletterSignupFull } from './newsletter-signup-full';

faker.seed(123);

const MOCK_SUPPORTING_TEXT = faker.lorem.sentence(8);
const MOCK_FIRST_CUE = faker.lorem.words(2);
const MOCK_SECOND_CUE = faker.lorem.words(3);

const setup = customRender(NewsletterSignupFull, {
  children: makeNewsletterSignupForm(),
});

describe(`<${NewsletterSignupFull.name}/>`, () => {
  it('renders the form it holds', () => {
    setup();

    const emailField = screen.getByRole('textbox', {
      name: MOCK_NEWSLETTER_EMAIL_LABEL,
    });

    expect(emailField).toBeVisible();
  });

  it('renders the supporting text', () => {
    setup({ supportingText: MOCK_SUPPORTING_TEXT });

    const supportingText = screen.getByText(MOCK_SUPPORTING_TEXT);

    expect(supportingText).toBeVisible();
  });

  it('renders no heading of its own', () => {
    setup({ supportingText: MOCK_SUPPORTING_TEXT });

    const heading = screen.queryByRole('heading');

    expect(heading).not.toBeInTheDocument();
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
});
