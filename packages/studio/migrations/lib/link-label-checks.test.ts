import { faker } from '@faker-js/faker';

import { hasMissingLabel, hasOversizedLabel } from './link-label-checks';
import { LINK_LABEL_MAX_LENGTH } from './link-label-max-length';

faker.seed(4);

const MOCK_LABEL = faker.lorem.words();

describe(hasMissingLabel, () => {
  it.each([
    ['an absent label', {}, true],
    ['a whitespace-only label', { label: '   ' }, true],
    ['a real label', { label: MOCK_LABEL }, false],
  ])('for %s is %s', (_label, link, expected) => {
    expect(hasMissingLabel(link)).toBe(expected);
  });
});

describe(hasOversizedLabel, () => {
  it.each([
    [
      'a label at the limit',
      { label: 'x'.repeat(LINK_LABEL_MAX_LENGTH) },
      false,
    ],
    [
      'a label over the limit',
      { label: 'x'.repeat(LINK_LABEL_MAX_LENGTH + 1) },
      true,
    ],
    ['a missing label', {}, false],
  ])('for %s is %s', (_label, link, expected) => {
    expect(hasOversizedLabel(link)).toBe(expected);
  });
});
