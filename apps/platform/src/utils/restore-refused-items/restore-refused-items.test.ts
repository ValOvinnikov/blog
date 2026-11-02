import { LOCALE_ISO_CODES } from '@blog/config';
import { faker } from '@faker-js/faker';

import { restoreRefusedItems } from './restore-refused-items';

faker.seed(6577);

const { DE, FR, NL } = LOCALE_ISO_CODES;
const MOCK_SAVED_NAME = faker.person.fullName();
const MOCK_EDITED_NAME = faker.person.fullName();
const MOCK_SAVED_TITLE = faker.lorem.words(2);
const MOCK_EDITED_TITLE = faker.lorem.words(2);

describe(restoreRefusedItems, () => {
  it('drops the refused entries from a list', () => {
    expect(restoreRefusedItems([DE, FR, NL], [DE], [FR, NL])).toEqual([DE]);
  });

  it('puts a record’s refused keys back to their saved values and keeps every other edit', () => {
    const restored = restoreRefusedItems(
      { name: MOCK_EDITED_NAME, title: MOCK_EDITED_TITLE },
      { name: MOCK_SAVED_NAME, title: MOCK_SAVED_TITLE },
      ['name'],
    );

    expect(restored).toEqual({
      name: MOCK_SAVED_NAME,
      title: MOCK_EDITED_TITLE,
    });
  });

  it('ignores a refused item the record has no key for', () => {
    const values = { name: MOCK_EDITED_NAME };

    expect(
      restoreRefusedItems(values, { name: MOCK_SAVED_NAME }, [DE]),
    ).toEqual(values);
  });
});
