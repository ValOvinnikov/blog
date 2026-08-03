import type { Meta, StoryObj } from '@storybook/react-vite';

import { WindowChrome } from './window-chrome';

const meta = {
  title: 'Molecules/WindowChrome',
  component: WindowChrome,
  tags: ['autodocs'],
  args: {
    children: (
      <>
        <WindowChrome.Bar>
          <WindowChrome.User>guest</WindowChrome.User>
          <WindowChrome.Prompt>@ovinnikov:~$</WindowChrome.Prompt> auth login
          <WindowChrome.Tag>popover</WindowChrome.Tag>
        </WindowChrome.Bar>
        <WindowChrome.Body>Choose a sign-in provider.</WindowChrome.Body>
      </>
    ),
  },
} satisfies Meta<typeof WindowChrome>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const LoggedInAccountMenu: TStory = {
  args: {
    children: (
      <>
        <WindowChrome.Bar>
          <WindowChrome.User>val</WindowChrome.User>
          <WindowChrome.Prompt>@ovinnikov:~$</WindowChrome.Prompt> whoami
          <WindowChrome.Tag>menu</WindowChrome.Tag>
        </WindowChrome.Bar>
        <WindowChrome.Body>
          <p>Val Ovinnikov</p>
          <p>val@icloud.com</p>
        </WindowChrome.Body>
      </>
    ),
  },
};

export const FilePathPrompt: TStory = {
  args: {
    children: (
      <>
        <WindowChrome.Bar>
          <WindowChrome.Prompt>~/post/</WindowChrome.Prompt>
          <WindowChrome.User>static-first-rendering.md</WindowChrome.User>
          <span>— rate this post</span>
        </WindowChrome.Bar>
        <WindowChrome.Body>
          rate ▐█████████░▌ 4.6/5 · n=23 ratings
        </WindowChrome.Body>
      </>
    ),
  },
};

export const CommandWithCountTag: TStory = {
  args: {
    children: (
      <>
        <WindowChrome.Bar>
          <WindowChrome.Prompt>$</WindowChrome.Prompt> git log --comments
          <WindowChrome.User>--post=static-first</WindowChrome.User>
          <WindowChrome.Tag>Comments · 4</WindowChrome.Tag>
        </WindowChrome.Bar>
        <WindowChrome.Body>Comment thread content goes here.</WindowChrome.Body>
      </>
    ),
  },
};

export const BodyOnly: TStory = {
  args: {
    children: (
      <WindowChrome.Body>A window with no title bar.</WindowChrome.Body>
    ),
  },
};
