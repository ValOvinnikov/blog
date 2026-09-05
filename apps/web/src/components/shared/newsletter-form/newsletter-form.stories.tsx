import { CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { userEvent, within } from 'storybook/test';

import { NewsletterForm } from './newsletter-form';

const meta = {
  title: 'Components/NewsletterForm',
  component: NewsletterForm,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
  },
  args: {
    variant: 'full',
    heading: 'Get new posts in your inbox',
    supportingText: 'One email a week, no spam, unsubscribe anytime.',
  },
} satisfies Meta<typeof NewsletterForm>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Full: TStory = {};

export const Compact: TStory = {
  args: { variant: 'compact', supportingText: undefined },
};

/**
 * Client-side email-format validation runs before the (mocked) server
 * action — this never issues a submit call, just flips the field to its
 * error state.
 */
export const InvalidEmail: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole('textbox');
    await userEvent.type(input, 'not-an-email');
    await userEvent.click(canvas.getByRole('button', { name: /Subscribe/ }));
  },
};

/**
 * Submits a valid address through the Storybook-mocked action
 * (`.storybook/mocks/newsletter-actions.ts`) — the real `'use server'`
 * action isn't reachable from a static Storybook build.
 */
export const Success: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole('textbox');
    await userEvent.type(input, 'reader@example.com');
    await userEvent.click(canvas.getByRole('button', { name: /Subscribe/ }));
    await canvas.findByText(/Almost there/);
  },
};

export const ServerError: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = await canvas.findByRole('textbox');
    await userEvent.type(input, 'reader-fail@example.com');
    await userEvent.click(canvas.getByRole('button', { name: /Subscribe/ }));
    await canvas.findByText(/Something went wrong/);
  },
};
