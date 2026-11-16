import { faker } from '@faker-js/faker';
import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  LOCALE_ISO_CODES,
} from '@shinefold/config/constants';
import { MOCK_TEAM_MODULE_ID } from '@shinefold/service/testing/modules/team/fixtures';
import { mockReference } from '@shinefold/service/testing/shared/fixtures';
import { evaluateModuleQuery } from '@shinefold/service/testing/shared/groq';
import { mockLocalizedHeadingBlock } from '@shinefold/service/testing/shared/localized';
import {
  MOCK_AUTHORED_MODULE_APPEARANCE,
  mockRawModuleAppearance,
} from '@shinefold/service/testing/shared/module-appearance';

import { teamModuleQuery } from './query';

faker.seed(7232);

const { EN } = LOCALE_ISO_CODES;

const MOCK_MEMBER_ID = faker.string.uuid();

const MOCK_MEMBER_DOCUMENT = {
  _id: MOCK_MEMBER_ID,
  _type: 'person',
  name: faker.person.fullName(),
};

const MOCK_TEAM_DOCUMENT = {
  _id: MOCK_TEAM_MODULE_ID,
  _type: 'module_team',
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockLocalizedHeadingBlock({ [EN]: faker.lorem.words(3) }),
  members: [mockReference(MOCK_MEMBER_ID, { _key: faker.string.uuid() })],
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  cardAlignment: CONTENT_ALIGNMENT.CENTER,
};

function runTeam(document: Record<string, unknown> = MOCK_TEAM_DOCUMENT) {
  return evaluateModuleQuery(
    teamModuleQuery,
    [document, MOCK_MEMBER_DOCUMENT],
    {
      id: MOCK_TEAM_MODULE_ID,
      locale: EN,
    },
  );
}

describe('teamModuleQuery', () => {
  it('reads no appearance overrides from a document authored without them', async () => {
    const module = await runTeam();

    expect(module).toMatchObject(mockRawModuleAppearance());
  });

  it('reads the authored appearance overrides', async () => {
    const module = await runTeam({
      ...MOCK_TEAM_DOCUMENT,
      ...MOCK_AUTHORED_MODULE_APPEARANCE,
    });

    expect(module).toMatchObject(MOCK_AUTHORED_MODULE_APPEARANCE);
  });
});
