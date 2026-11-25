import { faker } from '@faker-js/faker';
import { PORTABLE_TEXT_BLOCK_TYPE } from '@shinefold/config';
import type { TPortableTextBody } from '@shinefold/service';

type TAsideBlock = Extract<
  TPortableTextBody[number],
  { _type: typeof PORTABLE_TEXT_BLOCK_TYPE.ASIDE }
>;

export const mockAsideBlock = (
  body: TAsideBlock['body'],
  kind?: TAsideBlock['kind'],
): TAsideBlock => ({
  _type: PORTABLE_TEXT_BLOCK_TYPE.ASIDE,
  _key: faker.string.uuid(),
  kind,
  body,
});
