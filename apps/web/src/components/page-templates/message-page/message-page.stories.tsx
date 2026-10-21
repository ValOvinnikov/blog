import { Button } from '@blog/ui/components/atoms/button';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { MessagePage } from './message-page';

const meta = {
  title: 'Page Templates/MessagePage',
  component: MessagePage,
  tags: ['autodocs'],
  args: {
    title: 'Unsubscribe from our newsletter',
    message:
      'Click the button below to confirm you no longer want to receive newsletter emails from us.',
    children: <Button type="submit">Confirm unsubscribe</Button>,
  },
} satisfies Meta<typeof MessagePage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};
