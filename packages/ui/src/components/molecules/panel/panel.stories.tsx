import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Panel } from './panel';

faker.seed(123);

const accountFirstName = faker.person.firstName();
const accountLastName = faker.person.lastName();
const accountName = `${accountFirstName} ${accountLastName}`;
const accountEmail = faker.internet.email({
  firstName: accountFirstName,
  lastName: accountLastName,
});
const postTitle = faker.lorem.sentence(4);

const meta = {
  title: 'Molecules/Panel',
  component: Panel,
  tags: ['autodocs'],
  args: {
    children: (
      <>
        <Panel.Header headingLevel={2}>Sign in</Panel.Header>
        <Panel.Body>Choose a sign-in provider.</Panel.Body>
      </>
    ),
  },
} satisfies Meta<typeof Panel>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Account: TStory = {
  args: {
    children: (
      <>
        <Panel.Header headingLevel={2}>Account</Panel.Header>
        <Panel.Body>
          <p>{accountName}</p>
          <p>{accountEmail}</p>
        </Panel.Body>
      </>
    ),
  },
};

export const RatePost: TStory = {
  args: {
    children: (
      <>
        <Panel.Header headingLevel={3}>{postTitle}</Panel.Header>
        <Panel.Body>rate this post</Panel.Body>
      </>
    ),
  },
};

export const BodyOnly: TStory = {
  args: {
    children: <Panel.Body>A panel with no header.</Panel.Body>,
  },
};
