import { Avatar } from '@blog/ui/atoms/avatar';
import { Button } from '@blog/ui/atoms/button';
import { TextInput } from '@blog/ui/atoms/text-input';
import { Panel } from '@blog/ui/molecules/panel';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

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

export const MultipleControls: TStory = {
  args: {
    label: 'Connected identity',
    description: 'Link a provider to sign in without a password.',
    children: (
      <>
        <Button variant="ghost">link GitHub</Button>
        <Button variant="ghost">unlink Google</Button>
      </>
    ),
  },
};

const WideControlDemo = () => {
  const [name, setName] = useState('Bartholomew Featherstonehaugh-Whitmore');

  return (
    <Panel>
      <Panel.Header headingLevel={2}>Account · Identity</Panel.Header>
      <Panel.Body>
        <SettingRow
          label="Display name"
          description="Overrides your provider handle wherever your comments appear."
        >
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <Avatar name={name} alt="" />
              <TextInput
                value={name}
                onChange={setName}
                ariaLabel="Display name"
                leadingIcon="›"
                className="min-w-0 flex-1"
              />
            </div>
            <Button variant="primary" className="w-full md:w-auto">
              save
            </Button>
          </div>
        </SettingRow>
      </Panel.Body>
    </Panel>
  );
};

export const WideControlContent: TStory = {
  render: () => <WideControlDemo />,
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
          placeholder="type: jane"
        />
        <Button variant="danger" isDisabled={true}>
          delete account
        </Button>
      </>
    ),
  },
};

export const PrivacySection: TStory = {
  render: () => (
    <Panel>
      <Panel.Header headingLevel={2}>Account · Privacy</Panel.Header>
      <Panel.Body>
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
            placeholder="type: jane"
          />
          <Button variant="danger" isDisabled={true}>
            delete account
          </Button>
        </SettingRow>
      </Panel.Body>
    </Panel>
  ),
};
