import { faker } from '@faker-js/faker';
import { BRAND_VARIANT } from '@shinefold/config';
import {
  CardStyles,
  FilledAndPlainOnEachBand,
} from '@shinefold/ui/testing/card-styles';
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

type TItem = { question: string; answer: string };

const renderItems = (items: TItem[]) =>
  items.map((item) => (
    <Accordion.Item key={item.question}>
      <Accordion.Trigger>{item.question}</Accordion.Trigger>
      <Accordion.Panel>{item.answer}</Accordion.Panel>
    </Accordion.Item>
  ));

const meta = {
  title: 'Organisms/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  args: {
    children: renderItems(threeItems),
  },
} satisfies Meta<typeof Accordion>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

const openItem: TItem = {
  question: faker.lorem.sentence(),
  answer: faker.lorem.paragraph(),
};

export const FirstItemOpen: TStory = {
  args: {
    defaultValue: [openItem.question],
    children: [openItem, ...threeItems].map((item) => (
      <Accordion.Item key={item.question} value={item.question}>
        <Accordion.Trigger>{item.question}</Accordion.Trigger>
        <Accordion.Panel>{item.answer}</Accordion.Panel>
      </Accordion.Item>
    )),
  },
};

export const InEachCardStyle: TStory = {
  render: (args) => <CardStyles>{() => <Accordion {...args} />}</CardStyles>,
};

export const FilledAndPlain: TStory = {
  name: 'Filled and plain, on each band',
  render: (args) => (
    <FilledAndPlainOnEachBand>
      <div style={{ flex: 1 }}>
        <Accordion {...args} />
      </div>
    </FilledAndPlainOnEachBand>
  ),
};

export const EightItems: TStory = {
  args: {
    children: renderItems(eightItems),
  },
};

const RICH_CONTENT_VALUE = 'rich-content';

export const WithRichContent: TStory = {
  args: {
    defaultValue: [RICH_CONTENT_VALUE],
    children: (
      <Accordion.Item value={RICH_CONTENT_VALUE}>
        <Accordion.Trigger>{faker.lorem.sentence()}</Accordion.Trigger>
        <Accordion.Panel>
          <p>{faker.lorem.sentence()}</p>
          <ul>
            <li>{faker.lorem.words(4)}</li>
            <li>{faker.lorem.words(4)}</li>
            <li>{faker.lorem.words(4)}</li>
          </ul>
          <p>
            {faker.lorem.sentence()}{' '}
            <a href="https://example.com">{faker.lorem.words(3)}</a>
          </p>
        </Accordion.Panel>
      </Accordion.Item>
    ),
  },
};

const OnSecondary = () => (
  <div
    className="bg-ambient"
    data-skin={BRAND_VARIANT.SECONDARY}
    style={{ padding: '1.5rem' }}
  >
    <Accordion>{renderItems(threeItems)}</Accordion>
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
    className="bg-ambient"
    data-skin={BRAND_VARIANT.BRAND_PRIMARY}
    style={{ padding: '1.5rem' }}
  >
    <Accordion>{renderItems(threeItems)}</Accordion>
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
