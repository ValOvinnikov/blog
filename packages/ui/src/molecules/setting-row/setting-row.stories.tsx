import { Button } from '@blog/ui/atoms/button';
import { TextInput } from '@blog/ui/atoms/text-input';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { SettingRow } from './setting-row';

const meta = {
  title: 'Molecules/SettingRow',
  component: SettingRow,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    label: 'Export my data',
    description:
      'Download your comments, ratings, bookmarks, subscription and profile as a single JSON archive.',
    children: <Button variant="ghost">request export</Button>,
  },
} satisfies Meta<typeof SettingRow>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutControl: TStory = {
  args: { children: undefined },
};

export const Danger: TStory = {
  args: {
    tone: 'danger',
    label: '⚠ Delete account',
    description:
      'Irreversible. Comments become tombstones; ratings, bookmarks, subscription and sessions are erased.',
    children: (
      <>
        <TextInput
          value=""
          onChange={() => {}}
          ariaLabel="Type your handle to confirm deletion"
          placeholder="type: val"
        />
        <Button variant="danger" disabled>
          delete account
        </Button>
      </>
    ),
  },
};

export const PrivacySection: TStory = {
  render: () => (
    <WindowChrome>
      <WindowChrome.Bar>
        <WindowChrome.User>val</WindowChrome.User>
        <WindowChrome.Prompt>@ovinnikov:~$</WindowChrome.Prompt> account
        --privacy
        <WindowChrome.Tag>data</WindowChrome.Tag>
      </WindowChrome.Bar>
      <WindowChrome.Body>
        <SettingRow
          label="Export my data"
          description="Download your comments, ratings, bookmarks, subscription and profile as a single JSON archive."
        >
          <Button variant="ghost">request export</Button>
        </SettingRow>
        <SettingRow
          tone="danger"
          label="⚠ Delete account"
          description="Irreversible. Comments become tombstones; ratings, bookmarks, subscription and sessions are erased. Type your handle to arm the button."
        >
          <TextInput
            value=""
            onChange={() => {}}
            ariaLabel="Type your handle to confirm deletion"
            placeholder="type: val"
          />
          <Button variant="danger" disabled>
            delete account
          </Button>
        </SettingRow>
      </WindowChrome.Body>
    </WindowChrome>
  ),
};
