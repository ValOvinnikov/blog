import { FORM_STATUS } from '@blog/config';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NewsletterSignup } from './newsletter-signup';

faker.seed(123);

const meta = {
  title: 'Organisms/NewsletterSignup',
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type TStory = StoryObj<typeof meta>;

/**
 * `NewsletterSignup` exposes two mutually-exclusive densities — `Full` (the
 * rich panel form) and `Compact` (the slim single-row strip) — shown
 * together here. See `Organisms/NewsletterSignup/Full` and
 * `Organisms/NewsletterSignup/Compact` for each density's own controls.
 */
export const Overview: TStory = {
  render: () => (
    <div className="flex flex-col gap-8">
      <NewsletterSignup.Full
        email=""
        onChange={() => {}}
        onSubmit={() => {}}
        status={FORM_STATUS.IDLE}
        heading={faker.lorem.words(3)}
        supportingText={faker.lorem.sentences(2)}
        submitLabel={faker.lorem.word()}
        emailAriaLabel={faker.lorem.words(2)}
        placeholder={faker.internet.email()}
      />
      <NewsletterSignup.Compact
        email=""
        onChange={() => {}}
        onSubmit={() => {}}
        status={FORM_STATUS.IDLE}
        heading={faker.lorem.words(3)}
        prefix={<span aria-hidden="true">$</span>}
        submitLabel={faker.lorem.word()}
        emailAriaLabel={faker.lorem.words(2)}
        placeholder={faker.internet.email()}
      />
    </div>
  ),
};
