import { SITE_MESSAGES } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { resolveVoiceRichFields } from '@web/utils/resolve-voice-rich-fields';

import { NotFoundPage } from './not-found-page';

const meta = {
  title: 'Pages/NotFoundPage',
  component: NotFoundPage,
  tags: ['autodocs'],
  args: {
    supportingText: resolveVoiceRichFields({}, SITE_MESSAGES)
      .notFoundSupportingText,
  },
} satisfies Meta<typeof NotFoundPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
