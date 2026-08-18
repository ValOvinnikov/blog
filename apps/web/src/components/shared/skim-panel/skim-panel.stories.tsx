import type { TPostSkim } from '@blog/service';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DepthToggle } from '@web/components/shared/depth-toggle';
import { DepthProvider } from '@web/context/depth-provider';
import { userEvent, within } from 'storybook/test';

import { SkimPanel } from './skim-panel';

const skim: TPostSkim = {
  takeaways: [
    'Reviews were taking three days on average before the new triage rule.',
    'Auto-assigning by file ownership cut that to under a day.',
    'The same rule now flags stale reviews after 24 hours of silence.',
  ],
  generatedAt: '2026-01-01T00:00:00.000Z',
  model: 'storybook-fixture',
};

const labels = {
  skim: '30s',
  read: 'Read',
  deep: 'Deep',
  ariaLabel: 'Reading depth',
};

/**
 * `SkimPanel` is CSS-gated (hidden unless the nearest `DepthProvider`
 * wrapper is in `SKIM`) — every story renders the real `DepthToggle`
 * alongside it, the same pairing a post page actually mounts, since that's
 * the only way a reader (or this story) reveals the panel.
 */
const meta = {
  title: 'Components/SkimPanel',
  component: SkimPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    skim,
    label: '30-second summary',
    readFullArticleLabel: 'Read the full article',
  },
  decorators: [
    (Story) => (
      <DepthProvider hasSkim={true} hasDeep={false}>
        <DepthToggle hasSkim={true} hasDeep={false} labels={labels} />
        <Story />
      </DepthProvider>
    ),
  ],
} satisfies Meta<typeof SkimPanel>;

export default meta;
type TStory = StoryObj<typeof meta>;

/** Default `READ` depth — the panel is present in the DOM but CSS-hidden. */
export const HiddenAtReadDepth: TStory = {};

export const RevealedAtSkimDepth: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: '30s' }));
  },
};

export const NoSkim: TStory = {
  args: { skim: undefined },
};
