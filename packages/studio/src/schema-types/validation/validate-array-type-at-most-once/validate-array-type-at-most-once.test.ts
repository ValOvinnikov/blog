import { validateArrayTypeAtMostOnce } from '@blog/studio/schema-types/validation/validate-array-type-at-most-once/validate-array-type-at-most-once';
import { faker } from '@faker-js/faker';

faker.seed(5086);

const MOCK_LIMITED_TYPE = faker.lorem.word();
const MOCK_OTHER_TYPE = `${MOCK_LIMITED_TYPE}-other`;
const MOCK_MESSAGE = faker.lorem.sentence();

const validate = validateArrayTypeAtMostOnce(MOCK_LIMITED_TYPE, MOCK_MESSAGE);

describe(validateArrayTypeAtMostOnce, () => {
  it.each([
    ['passes when the array is unset', undefined, true],
    ['passes when the type is absent', [{ _type: MOCK_OTHER_TYPE }], true],
    [
      'passes when the type appears once among others',
      [
        { _type: MOCK_OTHER_TYPE },
        { _type: MOCK_LIMITED_TYPE },
        { _type: MOCK_OTHER_TYPE },
      ],
      true,
    ],
    [
      'fails when the type appears twice',
      [
        { _type: MOCK_LIMITED_TYPE },
        { _type: MOCK_OTHER_TYPE },
        { _type: MOCK_LIMITED_TYPE },
      ],
      MOCK_MESSAGE,
    ],
  ])('%s', (_description, members, expected) => {
    expect(validate(members)).toBe(expected);
  });
});
