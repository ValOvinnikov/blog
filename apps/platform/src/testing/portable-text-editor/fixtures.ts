import type { TEmailTemplateBlock } from '@blog/db/schema/email-templates';
import { faker } from '@faker-js/faker';

export const BULLET_LIST_ITEM = 'bullet';
export const NUMBER_LIST_ITEM = 'number';

type TMockTextBlockOverrides = {
  text?: string;
  listItem?: string;
  level?: number;
};

export const mockTextBlock = ({
  text = faker.lorem.words(3),
  listItem,
  level = 1,
}: TMockTextBlockOverrides = {}): TEmailTemplateBlock => ({
  _type: 'block',
  _key: faker.string.uuid(),
  style: 'normal',
  ...(listItem === undefined ? {} : { listItem, level }),
  children: [{ _type: 'span', _key: faker.string.uuid(), text, marks: [] }],
});
