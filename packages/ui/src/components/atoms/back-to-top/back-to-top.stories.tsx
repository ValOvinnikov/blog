import type { Meta, StoryObj } from '@storybook/react-vite';

import { BackToTop } from './back-to-top';

const meta: Meta<typeof BackToTop> = {
  title: 'Atoms/BackToTop',
  component: BackToTop,
  tags: ['autodocs'],
  args: {
    ariaLabel: 'Back to top',
    onClick: () => {},
  },
};
export default meta;

type TStory = StoryObj<typeof BackToTop>;

export const Visible: TStory = {
  args: { isVisible: true },
};

export const Hidden: TStory = {
  args: { isVisible: false },
};
