import { ICONS, Size } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { buildShareLinks } from '@web/utils/build-share-links';
import { toSocialIconName } from '@web/utils/to-social-icon-name';
import { userEvent, within } from 'storybook/test';

import { PostShare } from './post-share';

const url = 'https://example.com/blog/how-we-ship-reviews-faster';
const title = 'How we ship reviews faster';

const links = buildShareLinks({ url, title }).map((link) => ({
  ...link,
  icon: (
    <Icon
      name={toSocialIconName(link.platform) ?? ICONS.EXTERNAL_LINK}
      size={Size.SM}
    />
  ),
}));

const meta = {
  title: 'Components/PostShare',
  component: PostShare,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  args: { url, title, links },
} satisfies Meta<typeof PostShare>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Closed: TStory = {};

export const Open: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button');
    await userEvent.click(trigger);
  },
};

/**
 * "Copy link" flips to its copied state (icon + label) for `resetMs` after
 * a click — this pins that transient state open for review.
 */
export const CopiedLink: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = await canvas.findByRole('button');
    await userEvent.click(trigger);
    const copyItem = await canvas.findByRole('menuitem', { name: 'Copy link' });
    await userEvent.click(copyItem);
  },
};
