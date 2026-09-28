import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from 'storybook/test';

import { Accordion } from './accordion';

const threeItems = Array.from({ length: 3 }, () => ({
  question: faker.lorem.sentence(),
  answer: faker.lorem.paragraph(),
}));

const eightItems = Array.from({ length: 8 }, () => ({
  question: faker.lorem.sentence(),
  answer: faker.lorem.paragraph(),
}));

const meta = {
  title: 'Organisms/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  args: {
    children: threeItems.map((item) => (
      <Accordion.Item key={item.question}>
        <Accordion.Trigger>{item.question}</Accordion.Trigger>
        <Accordion.Panel>{item.answer}</Accordion.Panel>
      </Accordion.Item>
    )),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const EightItems: TStory = {
  args: {
    children: eightItems.map((item) => (
      <Accordion.Item key={item.question}>
        <Accordion.Trigger>{item.question}</Accordion.Trigger>
        <Accordion.Panel>{item.answer}</Accordion.Panel>
      </Accordion.Item>
    )),
  },
};

export const WithRichContent: TStory = {
  args: {
    children: (
      <Accordion.Item>
        <Accordion.Trigger>{faker.lorem.sentence()}</Accordion.Trigger>
        <Accordion.Panel>
          <p>{faker.lorem.sentence()}</p>
          <ul>
            <li>{faker.lorem.words(4)}</li>
            <li>{faker.lorem.words(4)}</li>
            <li>{faker.lorem.words(4)}</li>
          </ul>
          <a href="https://example.com">{faker.lorem.words(3)}</a>
        </Accordion.Panel>
      </Accordion.Item>
    ),
  },
};

const OnSecondary = () => (
  <div className="bg-secondary surface-secondary" style={{ padding: '1.5rem' }}>
    <Accordion>
      {threeItems.map((item) => (
        <Accordion.Item key={item.question}>
          <Accordion.Trigger>{item.question}</Accordion.Trigger>
          <Accordion.Panel>{item.answer}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  </div>
);

export const OnSecondaryBackgroundFocused: TStory = {
  name: 'On a Secondary background, focused',
  render: OnSecondary,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getAllByRole('button')[0]?.focus();
  },
};

const OnBrandPrimary = () => (
  <div
    className="bg-brand-primary-muted surface-brand-primary"
    style={{ padding: '1.5rem' }}
  >
    <Accordion>
      {threeItems.map((item) => (
        <Accordion.Item key={item.question}>
          <Accordion.Trigger>{item.question}</Accordion.Trigger>
          <Accordion.Panel>{item.answer}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  </div>
);

export const OnBrandPrimaryBackgroundFocused: TStory = {
  name: 'On a Brand-primary background, focused',
  render: OnBrandPrimary,
  play: ({ canvasElement }) => {
    const canvas = within(canvasElement);
    canvas.getAllByRole('button')[0]?.focus();
  },
};
